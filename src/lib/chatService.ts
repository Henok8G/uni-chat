import { prisma } from "./prisma";
import { resolveUserAvatar } from "./avatars";
import type { GroupItem } from "@/components/chat/types";

function formatRelativeTime(date?: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export interface ChatMessageRecord {
  id: string;
  senderId: string;
  receiverId?: string | null;
  groupId?: string | null;
  text: string;
  createdAt: string | Date;
  senderName?: string;
  senderAvatar?: string;
}

// Runtime DDL eliminated: isRead is formally part of the ChatMessage schema and database
async function ensureChatMessageIsReadColumn() {
  // Formalized via ARCH-001 migration; runtime DDL is no longer needed
}

export async function markChatAsRead(userId: string, targetId: string) {
  try {
    await prisma.chatMessage.updateMany({
      where: {
        senderId: targetId,
        receiverId: userId,
        OR: [{ isRead: false }, { isRead: null }],
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    console.error("[chatService] markChatAsRead error:", error);
  }
}

/**
 * Returns the list of personal friends/chats for a user.
 */
export async function getPersonalChatsForUser(userId: string): Promise<GroupItem[]> {
  try {
    await ensureChatMessageIsReadColumn();

    const rawFriends = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT DISTINCT 
        u.id, 
        u."displayName", 
        u.email, 
        u."avatarUrl", 
        u.gender, 
        u.department, 
        u.year,
        f."createdAt" as "friendCreatedAt"
      FROM "Friendship" f
      JOIN "User" u ON u.id = f."friendId"
      WHERE f."userId" = $1 AND u.banned = false
      ORDER BY f."createdAt" DESC
      `,
      userId
    );

    if (!rawFriends || rawFriends.length === 0) {
      return [];
    }

    const friendIds = rawFriends.map((f) => f.id);

    // Batch fetch latest message and unread count for all friends in a single round-trip
    const statsQuery = `
      WITH latest_msgs AS (
        SELECT DISTINCT ON ("partnerId")
          CASE WHEN m."senderId" = $1 THEN m."receiverId" ELSE m."senderId" END AS "partnerId",
          m.text,
          m."createdAt"
        FROM "ChatMessage" m
        WHERE (m."receiverId" = $1 AND m."senderId" = ANY($2::text[]))
           OR (m."senderId" = $1 AND m."receiverId" = ANY($2::text[]))
        ORDER BY "partnerId", m."createdAt" DESC
      ),
      unread_counts AS (
        SELECT
          m."senderId" AS "partnerId",
          COUNT(*)::int AS "unreadCount"
        FROM "ChatMessage" m
        WHERE m."receiverId" = $1
          AND m."senderId" = ANY($2::text[])
          AND (m."isRead" = false OR m."isRead" IS NULL)
        GROUP BY m."senderId"
      )
      SELECT 
        f.id AS "partnerId",
        lm.text AS "lastMessageText",
        lm."createdAt" AS "lastMessageCreatedAt",
        COALESCE(uc."unreadCount", 0)::int AS "unreadCount"
      FROM unnest($2::text[]) AS f(id)
      LEFT JOIN latest_msgs lm ON lm."partnerId" = f.id
      LEFT JOIN unread_counts uc ON uc."partnerId" = f.id
    `;

    const statsRows = await prisma.$queryRawUnsafe<any[]>(statsQuery, userId, friendIds);
    const statsMap = new Map<string, { lastMessageText?: string; lastMessageCreatedAt?: Date | string; unreadCount: number }>();
    for (const row of statsRows) {
      statsMap.set(row.partnerId, {
        lastMessageText: row.lastMessageText ?? undefined,
        lastMessageCreatedAt: row.lastMessageCreatedAt ?? undefined,
        unreadCount: Number(row.unreadCount ?? 0),
      });
    }

    const items: GroupItem[] = [];

    for (const friend of rawFriends) {
      const emailFallbackName = (friend.email || "")
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

      const displayName = friend.displayName || emailFallbackName || "Student";
      const avatarUrl =
        friend.avatarUrl ||
        resolveUserAvatar({
          id: friend.id,
          email: friend.email,
          displayName,
          gender: friend.gender,
          emailVerified: true,
          role: "STUDENT",
        });

      const stat = statsMap.get(friend.id);
      const hasLastMsg = Boolean(stat?.lastMessageText);

      items.push({
        id: friend.id,
        name: displayName,
        avatarUrl,
        lastMessage: hasLastMsg
          ? stat!.lastMessageText!
          : friend.department
            ? `${friend.department} • Year ${friend.year || 1}`
            : "Added as friend",
        lastMessageTime: hasLastMsg
          ? formatRelativeTime(stat!.lastMessageCreatedAt!)
          : formatRelativeTime(friend.friendCreatedAt),
        unreadCount: stat?.unreadCount ?? 0,
        isOnline: false,
        kind: "personal",
      });
    }

    return items;
  } catch (error) {
    console.error("[chatService] getPersonalChatsForUser error:", error);
    return [];
  }
}

/**
 * Returns the list of joined groups for a user.
 */
export async function getJoinedGroupsForUser(userId: string): Promise<GroupItem[]> {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: {
        userId,
        group: {
          isArchived: false,
        },
      },
      include: {
        group: {
          include: {
            members: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const groupIds = memberships.map((m) => m.group.id);

    // Batch fetch latest message for all joined groups in a single round-trip
    const groupLastMsgQuery = `
      SELECT DISTINCT ON (m."groupId")
        m."groupId",
        m.text,
        m."createdAt"
      FROM "ChatMessage" m
      WHERE m."groupId" = ANY($1::text[])
      ORDER BY m."groupId", m."createdAt" DESC
    `;

    const lastMsgRows = await prisma.$queryRawUnsafe<any[]>(groupLastMsgQuery, groupIds);
    const lastMsgMap = new Map<string, { text: string; createdAt: Date | string }>();
    for (const row of lastMsgRows) {
      lastMsgMap.set(row.groupId, {
        text: row.text,
        createdAt: row.createdAt,
      });
    }

    const items: GroupItem[] = [];

    for (const m of memberships) {
      const group = m.group;
      const lastMsg = lastMsgMap.get(group.id);
      const memberCount = group.members.length;

      items.push({
        id: group.id,
        name: group.name,
        lastMessage: lastMsg
          ? lastMsg.text
          : group.description
            ? group.description
            : `${memberCount} member${memberCount === 1 ? "" : "s"}`,
        lastMessageTime: lastMsg
          ? formatRelativeTime(lastMsg.createdAt)
          : formatRelativeTime(group.createdAt),
        unreadCount: 0,
        isOnline: true,
        kind: "group",
      });
    }

    return items;
  } catch (error) {
    console.error("[chatService] getJoinedGroupsForUser error:", error);
    return [];
  }
}

/**
 * Returns suggested groups the user has not joined yet.
 */
export async function getSuggestedGroupsForUser(userId: string): Promise<GroupItem[]> {
  try {
    const groups = await prisma.group.findMany({
      where: {
        isArchived: false,
        isDelisted: false,
        isRestricted: false,
        members: {
          none: {
            userId,
          },
        },
      },
      include: {
        members: {
          select: { id: true },
        },
      },
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
    });

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      lastMessage: g.description || `${g.campus || "AAU Campus"} • ${g.members.length} members`,
      lastMessageTime: formatRelativeTime(g.createdAt),
      unreadCount: 0,
      isOnline: false,
      kind: "group",
    }));
  } catch (error) {
    console.error("[chatService] getSuggestedGroupsForUser error:", error);
    return [];
  }
}

export interface FriendshipStatusResult {
  isFriend: boolean;
  pendingSent?: boolean;
  pendingReceived?: boolean;
  requestId?: string;
}

/**
 * Checks the real-time friendship and pending request status between two students.
 */
export async function getFriendshipStatus(
  userId: string,
  targetId: string
): Promise<FriendshipStatusResult> {
  try {
    if (!userId || !targetId || userId === targetId) {
      return { isFriend: false };
    }

    // 1. Check if already friends
    const existingFriend = await prisma.friendship.findFirst({
      where: { userId, friendId: targetId },
      select: { id: true },
    });
    if (existingFriend) {
      return { isFriend: true };
    }

    // 2. Check pending friend request from userId -> targetId
    const sentReq = await prisma.friendRequest.findFirst({
      where: { senderId: userId, receiverId: targetId, status: "PENDING" },
      select: { id: true },
    });
    if (sentReq) {
      return { isFriend: false, pendingSent: true, requestId: sentReq.id };
    }

    // 3. Check pending friend request from targetId -> userId
    const recReq = await prisma.friendRequest.findFirst({
      where: { senderId: targetId, receiverId: userId, status: "PENDING" },
      select: { id: true },
    });
    if (recReq) {
      return { isFriend: false, pendingReceived: true, requestId: recReq.id };
    }

    return { isFriend: false };
  } catch (error) {
    console.error("[chatService] getFriendshipStatus error:", error);
    return { isFriend: false };
  }
}

/**
 * Sends a friend request. Handles simultaneous reciprocal requests atomically.
 */
export async function sendFriendRequest(
  senderId: string,
  receiverId: string
): Promise<{
  success: boolean;
  status?: "PENDING" | "ACCEPTED";
  message?: string;
  error?: string;
  isFriend?: boolean;
}> {
  try {
    if (!senderId || !receiverId) {
      return { success: false, error: "Missing sender or recipient identifier" };
    }
    if (senderId === receiverId) {
      return { success: false, error: "Cannot send a friend request to yourself" };
    }

    // Verify sender
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, displayName: true, email: true, banned: true, emailVerified: true },
    });
    if (!sender || sender.banned) {
      return { success: false, error: "Account banned or unavailable" };
    }
    if (!sender.emailVerified) {
      return { success: false, error: "Email must be verified to send friend requests" };
    }

    // Verify recipient
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, displayName: true, email: true, banned: true },
    });
    if (!receiver || receiver.banned) {
      return { success: false, error: "Recipient user not found or unavailable" };
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: { userId: senderId, friendId: receiverId },
      select: { id: true },
    });
    if (existingFriendship) {
      return { success: false, error: "You are already friends with this student", isFriend: true };
    }

    return await prisma.$transaction(async (tx) => {
      // Check if recipient already sent us a pending request (Simultaneous reciprocal request handling)
      const existingReverse = await tx.friendRequest.findUnique({
        where: {
          senderId_receiverId: { senderId: receiverId, receiverId: senderId },
        },
      });

      if (existingReverse && existingReverse.status === "PENDING") {
        // Mutual desire to connect! Atomically accept the reverse request and establish friendship
        await tx.friendRequest.update({
          where: { id: existingReverse.id },
          data: { status: "ACCEPTED" },
        });

        const id1 = `fr_${senderId.slice(-8)}_${receiverId.slice(-8)}_${Date.now().toString(36)}`;
        const id2 = `fr_${receiverId.slice(-8)}_${senderId.slice(-8)}_${Date.now().toString(36)}`;

        await tx.friendship.upsert({
          where: { userId_friendId: { userId: senderId, friendId: receiverId } },
          create: { id: id1, userId: senderId, friendId: receiverId },
          update: {},
        });

        await tx.friendship.upsert({
          where: { userId_friendId: { userId: receiverId, friendId: senderId } },
          create: { id: id2, userId: receiverId, friendId: senderId },
          update: {},
        });

        await tx.notification.create({
          data: {
            userId: receiverId,
            type: "FRIEND_REQUEST",
            title: "Friend Request Accepted",
            message: `${sender.displayName || sender.email.split("@")[0]} accepted your friend request. You are now friends!`,
            link: `/app/chat?chatId=${senderId}`,
          },
        });

        return {
          success: true,
          status: "ACCEPTED",
          isFriend: true,
          message: "Mutual connection accepted! You are now friends.",
        };
      }

      // Check if forward request exists
      const existingForward = await tx.friendRequest.findUnique({
        where: {
          senderId_receiverId: { senderId, receiverId },
        },
      });

      if (existingForward) {
        if (existingForward.status === "PENDING") {
          return {
            success: true,
            status: "PENDING",
            message: "Friend request is already pending",
          };
        }
        if (existingForward.status === "ACCEPTED") {
          return {
            success: false,
            error: "You are already friends with this student",
            isFriend: true,
          };
        }
        // Re-open declined or cancelled request
        await tx.friendRequest.update({
          where: { id: existingForward.id },
          data: { status: "PENDING" },
        });

        await tx.notification.create({
          data: {
            userId: receiverId,
            type: "FRIEND_REQUEST",
            title: "New Friend Request",
            message: `${sender.displayName || sender.email.split("@")[0]} sent you a friend request.`,
            link: "/app/chat?tab=personal",
          },
        });

        return {
          success: true,
          status: "PENDING",
          message: "Friend request sent",
        };
      }

      // Create new FriendRequest
      await tx.friendRequest.create({
        data: {
          senderId,
          receiverId,
          status: "PENDING",
        },
      });

      await tx.notification.create({
        data: {
          userId: receiverId,
          type: "FRIEND_REQUEST",
          title: "New Friend Request",
          message: `${sender.displayName || sender.email.split("@")[0]} sent you a friend request.`,
          link: "/app/chat?tab=personal",
        },
      });

      return {
        success: true,
        status: "PENDING",
        message: "Friend request sent",
      };
    });
  } catch (error: any) {
    console.error("[chatService] sendFriendRequest error:", error);
    return { success: false, error: error?.message || "Failed to send friend request" };
  }
}

/**
 * Accepts a received friend request. Enforces that only the recipient can accept.
 */
export async function acceptFriendRequest(
  requestId: string,
  recipientUserId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    if (!requestId || !recipientUserId) {
      return { success: false, error: "Missing requestId or recipientUserId" };
    }

    return await prisma.$transaction(async (tx) => {
      const request = await tx.friendRequest.findUnique({
        where: { id: requestId },
        include: {
          sender: { select: { id: true, displayName: true, email: true } },
          receiver: { select: { id: true, displayName: true, email: true, banned: true, emailVerified: true } },
        },
      });

      if (!request) {
        return { success: false, error: "Friend request not found" };
      }

      // Authorization guard: Only the intended recipient can accept
      if (request.receiverId !== recipientUserId) {
        return { success: false, error: "Unauthorized: only the recipient can accept this request" };
      }

      if (!request.receiver || request.receiver.banned) {
        return { success: false, error: "Account banned or unavailable" };
      }
      if (!request.receiver.emailVerified) {
        return { success: false, error: "Email must be verified to accept friend requests" };
      }

      // Idempotency check
      if (request.status === "ACCEPTED") {
        return { success: true, message: "Friend request is already accepted" };
      }

      if (request.status !== "PENDING") {
        return { success: false, error: `Cannot accept a request with status ${request.status}` };
      }

      // Mark request as ACCEPTED
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      });

      // If reverse request also exists in pending state, accept it too
      await tx.friendRequest.updateMany({
        where: { senderId: recipientUserId, receiverId: request.senderId, status: "PENDING" },
        data: { status: "ACCEPTED" },
      });

      // Atomically create reciprocal friendship records
      const id1 = `fr_${request.senderId.slice(-8)}_${recipientUserId.slice(-8)}_${Date.now().toString(36)}`;
      const id2 = `fr_${recipientUserId.slice(-8)}_${request.senderId.slice(-8)}_${Date.now().toString(36)}`;

      await tx.friendship.upsert({
        where: { userId_friendId: { userId: request.senderId, friendId: recipientUserId } },
        create: { id: id1, userId: request.senderId, friendId: recipientUserId },
        update: {},
      });

      await tx.friendship.upsert({
        where: { userId_friendId: { userId: recipientUserId, friendId: request.senderId } },
        create: { id: id2, userId: recipientUserId, friendId: request.senderId },
        update: {},
      });

      // Send notification to the original sender
      await tx.notification.create({
        data: {
          userId: request.senderId,
          type: "FRIEND_REQUEST",
          title: "Friend Request Accepted",
          message: `${request.receiver.displayName || request.receiver.email.split("@")[0]} accepted your friend request. You are now friends!`,
          link: `/app/chat?chatId=${recipientUserId}`,
        },
      });

      return { success: true, message: "Friend request accepted" };
    });
  } catch (error: any) {
    console.error("[chatService] acceptFriendRequest error:", error);
    return { success: false, error: error?.message || "Failed to accept friend request" };
  }
}

/**
 * Declines a received friend request. Enforces that only the recipient can decline.
 */
export async function declineFriendRequest(
  requestId: string,
  recipientUserId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    if (!requestId || !recipientUserId) {
      return { success: false, error: "Missing requestId or recipientUserId" };
    }

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: "Friend request not found" };
    }

    // Authorization guard: Only the intended recipient can decline
    if (request.receiverId !== recipientUserId) {
      return { success: false, error: "Unauthorized: only the recipient can decline this request" };
    }

    if (request.status === "DECLINED") {
      return { success: true, message: "Friend request is already declined" };
    }

    if (request.status === "ACCEPTED") {
      return { success: false, error: "Cannot decline an already accepted friend request" };
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED" },
    });

    return { success: true, message: "Friend request declined" };
  } catch (error: any) {
    console.error("[chatService] declineFriendRequest error:", error);
    return { success: false, error: error?.message || "Failed to decline friend request" };
  }
}

/**
 * Cancels a sent friend request. Enforces that only the sender can cancel.
 */
export async function cancelFriendRequest(
  requestId: string,
  senderUserId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    if (!requestId || !senderUserId) {
      return { success: false, error: "Missing requestId or senderUserId" };
    }

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: "Friend request not found" };
    }

    if (request.senderId !== senderUserId) {
      return { success: false, error: "Unauthorized: only the sender can cancel this request" };
    }

    if (request.status === "CANCELLED") {
      return { success: true, message: "Friend request is already cancelled" };
    }

    if (request.status === "ACCEPTED") {
      return { success: false, error: "Cannot cancel an already accepted friend request" };
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    });

    return { success: true, message: "Friend request cancelled" };
  } catch (error: any) {
    console.error("[chatService] cancelFriendRequest error:", error);
    return { success: false, error: error?.message || "Failed to cancel friend request" };
  }
}

/**
 * Returns pending received friend requests for a student.
 */
export async function getReceivedFriendRequests(userId: string) {
  try {
    const rows = await prisma.friendRequest.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            gender: true,
            department: true,
            year: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => {
      const emailFallback = (r.sender.email || "").split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const displayName = r.sender.displayName || emailFallback || "Student";
      const avatarUrl =
        r.sender.avatarUrl ||
        resolveUserAvatar({
          id: r.sender.id,
          email: r.sender.email,
          displayName,
          gender: r.sender.gender,
          emailVerified: true,
          role: "STUDENT",
        });

      return {
        id: r.id,
        senderId: r.sender.id,
        senderName: displayName,
        senderAvatar: avatarUrl,
        senderDepartment: r.sender.department,
        senderYear: r.sender.year,
        senderBio: r.sender.bio,
        createdAt: r.createdAt.toISOString(),
      };
    });
  } catch (error) {
    console.error("[chatService] getReceivedFriendRequests error:", error);
    return [];
  }
}

/**
 * Returns pending sent friend requests for a student.
 */
export async function getSentFriendRequests(userId: string) {
  try {
    const rows = await prisma.friendRequest.findMany({
      where: { senderId: userId, status: "PENDING" },
      include: {
        receiver: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            gender: true,
            department: true,
            year: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => {
      const emailFallback = (r.receiver.email || "").split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const displayName = r.receiver.displayName || emailFallback || "Student";
      const avatarUrl =
        r.receiver.avatarUrl ||
        resolveUserAvatar({
          id: r.receiver.id,
          email: r.receiver.email,
          displayName,
          gender: r.receiver.gender,
          emailVerified: true,
          role: "STUDENT",
        });

      return {
        id: r.id,
        receiverId: r.receiver.id,
        receiverName: displayName,
        receiverAvatar: avatarUrl,
        receiverDepartment: r.receiver.department,
        receiverYear: r.receiver.year,
        createdAt: r.createdAt.toISOString(),
      };
    });
  } catch (error) {
    console.error("[chatService] getSentFriendRequests error:", error);
    return [];
  }
}

/**
 * Adds a user as a friend via mutual friend request handshake.
 */
export async function addFriend(
  userId: string,
  friendId: string
): Promise<{ success: boolean; error?: string; status?: string }> {
  return sendFriendRequest(userId, friendId);
}

/**
 * Fetches messages for a conversation (personal or group).
 */
export async function getConversationMessages(
  userId: string,
  targetId: string,
  kind: "personal" | "group"
): Promise<ChatMessageRecord[]> {
  try {
    if (kind === "personal") {
      markChatAsRead(userId, targetId).catch(() => {});
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `
        SELECT 
          m.id, 
          m."senderId", 
          m."receiverId", 
          m.text, 
          m."createdAt",
          u."displayName" as "senderDisplayName",
          u.email as "senderEmail",
          u."avatarUrl" as "senderAvatarUrl",
          u.gender as "senderGender"
        FROM "ChatMessage" m
        JOIN "User" u ON u.id = m."senderId"
        WHERE (m."senderId" = $1 AND m."receiverId" = $2)
           OR (m."senderId" = $2 AND m."receiverId" = $1)
        ORDER BY m."createdAt" ASC
        LIMIT 100
        `,
        userId,
        targetId
      );

      return rows.map((r) => ({
        id: r.id,
        senderId: r.senderId,
        receiverId: r.receiverId,
        text: r.text,
        createdAt: r.createdAt,
        senderName: r.senderDisplayName || r.senderEmail?.split("@")[0] || "Student",
        senderAvatar:
          r.senderAvatarUrl ||
          resolveUserAvatar({
            id: r.senderId,
            email: r.senderEmail,
            displayName: r.senderDisplayName,
            gender: r.senderGender,
            emailVerified: true,
            role: "STUDENT",
          }),
      }));
    } else {
      // Group messages: verify user membership for secure authorization
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: targetId,
            userId,
          },
        },
        select: { id: true },
      });

      if (!membership) {
        return [];
      }

      const rows = await prisma.$queryRawUnsafe<any[]>(
        `
        SELECT 
          m.id, 
          m."senderId", 
          m."groupId", 
          m.text, 
          m."createdAt",
          u."displayName" as "senderDisplayName",
          u.email as "senderEmail",
          u."avatarUrl" as "senderAvatarUrl",
          u.gender as "senderGender"
        FROM "ChatMessage" m
        JOIN "User" u ON u.id = m."senderId"
        WHERE m."groupId" = $1
        ORDER BY m."createdAt" ASC
        LIMIT 100
        `,
        targetId
      );

      return rows.map((r) => ({
        id: r.id,
        senderId: r.senderId,
        groupId: r.groupId,
        text: r.text,
        createdAt: r.createdAt,
        senderName: r.senderDisplayName || r.senderEmail?.split("@")[0] || "Student",
        senderAvatar:
          r.senderAvatarUrl ||
          resolveUserAvatar({
            id: r.senderId,
            email: r.senderEmail,
            displayName: r.senderDisplayName,
            gender: r.senderGender,
            emailVerified: true,
            role: "STUDENT",
          }),
      }));
    }
  } catch (error) {
    console.error("[chatService] getConversationMessages error:", error);
    return [];
  }
}

/**
 * Saves and sends a new message to a personal or group chat.
 */
export async function sendChatMessage(
  senderId: string,
  targetId: string,
  kind: "personal" | "group",
  text: string
): Promise<ChatMessageRecord | null> {
  try {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const msgId = `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    if (kind === "personal") {
      await prisma.chatMessage.create({
        data: {
          id: msgId,
          senderId,
          receiverId: targetId,
          text: trimmed,
          isRead: false,
        },
      });
      // Personal message sent - note: does not auto-create friendship bypassing handshake
    } else {
      await prisma.chatMessage.create({
        data: {
          id: msgId,
          senderId,
          groupId: targetId,
          text: trimmed,
        },
      });
    }

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, displayName: true, email: true, avatarUrl: true, gender: true },
    });

    const senderName = sender?.displayName || sender?.email?.split("@")[0] || "Student";
    const senderAvatar =
      sender?.avatarUrl ||
      resolveUserAvatar({
        id: sender?.id,
        email: sender?.email,
        displayName: senderName,
        gender: sender?.gender,
        emailVerified: true,
        role: "STUDENT",
      });

    return {
      id: msgId,
      senderId,
      receiverId: kind === "personal" ? targetId : null,
      groupId: kind === "group" ? targetId : null,
      text: trimmed,
      createdAt: new Date(),
      senderName,
      senderAvatar,
    };
  } catch (error) {
    console.error("[chatService] sendChatMessage error:", error);
    return null;
  }
}
