"use server";

import { requireAdminPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditAction, getAuditLogs } from "@/lib/audit";
import {
  UserRole,
  AdminPermission,
  PostReadyStatus,
  PostStatus,
  ContentType,
  AuthorType,
  ModerationActionType,
  TargetType,
  ReasonCategory,
  ReportStatus,
} from "@prisma/client";

// ==========================================
// 1. Multi-Admin Roles & Permissions System
// ==========================================

export async function assignAdminRole(
  targetUserId: string,
  role: UserRole,
  permissions: AdminPermission[]
) {
  const admin = await requireAdminPermission("MANAGE_ROLES");

  const existingUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!existingUser) throw new Error("Target user not found");

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role },
  });

  const assignment = await prisma.adminRoleAssignment.upsert({
    where: {
      userId_role: { userId: targetUserId, role },
    },
    create: {
      userId: targetUserId,
      role,
      permissions,
      grantedById: admin.id,
    },
    update: {
      permissions,
      grantedById: admin.id,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "ASSIGN_ADMIN_ROLE",
    targetType: TargetType.USER,
    targetId: targetUserId,
    details: { role, permissions },
  });

  return { user: updatedUser, assignment };
}

export async function removeAdminRole(targetUserId: string) {
  const admin = await requireAdminPermission("MANAGE_ROLES");

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: UserRole.STUDENT },
  });

  await prisma.adminRoleAssignment.deleteMany({
    where: { userId: targetUserId },
  });

  await logAuditAction({
    adminId: admin.id,
    action: "REMOVE_ADMIN_ROLE",
    targetType: TargetType.USER,
    targetId: targetUserId,
  });

  return updatedUser;
}

// ==========================================
// 2. Post-Ready Student Application & Status
// ==========================================

export async function applyForPostReady(reason: string, sampleLink?: string) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  if (!user.emailVerified) throw new Error("Email verification required before applying for post-ready status");

  const application = await prisma.postReadyApplication.create({
    data: {
      userId: user.id,
      reason,
      sampleLink,
      status: PostReadyStatus.PENDING,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      postReadyStatus: PostReadyStatus.PENDING,
      postReadyAppliedAt: new Date(),
    },
  });

  return application;
}

export async function reviewPostReadyApplication(
  applicationId: string,
  newStatus: PostReadyStatus,
  notes?: string
) {
  const admin = await requireAdminPermission("REVIEW_POST_READY");

  const app = await prisma.postReadyApplication.findUnique({ where: { id: applicationId } });
  if (!app) throw new Error("Application not found");

  const updatedApp = await prisma.postReadyApplication.update({
    where: { id: applicationId },
    data: {
      status: newStatus,
      notes,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: app.userId },
    data: {
      postReadyStatus: newStatus,
      postReadyReviewedAt: new Date(),
      postReadyReviewedBy: admin.id,
      postReadyNotes: notes,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: `POST_READY_${newStatus}`,
    targetType: TargetType.USER,
    targetId: app.userId,
    details: { applicationId, newStatus, notes },
  });

  return updatedApp;
}

// ==========================================
// 3. Content / Post Model & Publishing Workflow
// ==========================================

export async function createPost(data: {
  title: string;
  body: string;
  contentType: ContentType;
  authorType?: AuthorType;
  scheduledAt?: Date;
}) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const isStaff = user.role !== UserRole.STUDENT;

  if (!isStaff && user.postReadyStatus !== PostReadyStatus.APPROVED) {
    throw new Error("You must be a Post-Ready verified student to publish content.");
  }

  const initialStatus: PostStatus = isStaff
    ? data.scheduledAt ? PostStatus.SCHEDULED : PostStatus.PUBLISHED
    : PostStatus.PENDING_REVIEW;

  const publishedAt = initialStatus === PostStatus.PUBLISHED ? new Date() : null;

  const post = await prisma.post.create({
    data: {
      title: data.title,
      body: data.body,
      contentType: data.contentType,
      authorId: user.id,
      authorType: data.authorType || (isStaff ? AuthorType.ADMIN : AuthorType.STUDENT),
      status: initialStatus,
      publishedAt,
      scheduledAt: data.scheduledAt || null,
    },
  });

  return post;
}

export async function reviewPost(
  postId: string,
  action: "APPROVE" | "REJECT",
  rejectReason?: string
) {
  const admin = await requireAdminPermission("MANAGE_CONTENT");

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");

  const newStatus = action === "APPROVE" ? PostStatus.PUBLISHED : PostStatus.REJECTED;

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      status: newStatus,
      publishedAt: action === "APPROVE" ? new Date() : null,
      reviewedById: admin.id,
      reviewedAt: new Date(),
      rejectReason: action === "REJECT" ? rejectReason : null,
    },
  });

  await logAuditAction({
    adminId: admin.id,
    action: `POST_${action}`,
    targetType: TargetType.POST,
    targetId: postId,
    details: { title: post.title, action, rejectReason },
  });

  return updatedPost;
}

let lastScheduledCheck = 0;

export async function getPublishedFeed(limit = 20, cursor?: string) {
  // Debounce scheduled transitions so every feed read doesn't block on a synchronous DB write-lock
  const now = Date.now();
  if (now - lastScheduledCheck > 60000) {
    lastScheduledCheck = now;
    prisma.post.updateMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: { lte: new Date() },
      },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    }).catch((err) => {
      console.error("Scheduled posts transition error in getPublishedFeed:", err);
    });
  }

  return prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
    },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          department: true,
          role: true,
          postReadyStatus: true,
          university: { select: { name: true } },
        },
      },
      club: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
}

// ==========================================
// 4. Moderation & Enforcement History
// ==========================================

export async function applyModerationAction(data: {
  userId: string;
  actionType: ModerationActionType;
  reason: string;
  notes?: string;
  durationDays?: number;
  reportId?: string;
}) {
  const admin = await requireAdminPermission("MODERATE_REPORTS");

  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) throw new Error("User not found");

  const modAction = await prisma.moderationAction.create({
    data: {
      userId: data.userId,
      adminId: admin.id,
      actionType: data.actionType,
      reason: data.reason,
      notes: data.notes,
      durationDays: data.durationDays,
      reportId: data.reportId,
    },
  });

  // Apply user state mutations based on actionType
  if (data.actionType === ModerationActionType.BAN) {
    await prisma.user.update({
      where: { id: data.userId },
      data: { banned: true },
    });
  } else if (data.actionType === ModerationActionType.UNBAN) {
    await prisma.user.update({
      where: { id: data.userId },
      data: { banned: false, restrictedUntil: null },
    });
  } else if (data.actionType === ModerationActionType.WARNING) {
    await prisma.user.update({
      where: { id: data.userId },
      data: { warningCount: { increment: 1 } },
    });
  } else if (data.actionType === ModerationActionType.RESTRICTION || data.actionType === ModerationActionType.SUSPENSION) {
    const days = data.durationDays || 2;
    const restrictedUntil = new Date();
    restrictedUntil.setDate(restrictedUntil.getDate() + days);

    await prisma.user.update({
      where: { id: data.userId },
      data: { restrictedUntil },
    });
  }

  // Update report if associated
  if (data.reportId) {
    await prisma.report.update({
      where: { id: data.reportId },
      data: {
        status: data.actionType === ModerationActionType.DISMISS ? ReportStatus.DISMISSED : ReportStatus.ACTION_TAKEN,
        resolved: true,
        resolutionNotes: `${data.actionType}: ${data.reason}`,
        handledByAdminId: admin.id,
      },
    });
  }

  await logAuditAction({
    adminId: admin.id,
    action: `MODERATION_${data.actionType}`,
    targetType: TargetType.USER,
    targetId: data.userId,
    details: { reason: data.reason, durationDays: data.durationDays, reportId: data.reportId },
  });

  return modAction;
}

export async function getUserModerationHistory(userId: string) {
  await requireAdminPermission("MODERATE_REPORTS");

  return prisma.moderationAction.findMany({
    where: { userId },
    include: {
      admin: { select: { email: true, role: true } },
      report: { select: { reasonCategory: true, details: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ==========================================
// 5. Expanded Targetable Reporting System
// ==========================================

export async function fileTargetedReport(data: {
  targetType: TargetType;
  targetId: string;
  reportedUserId: string;
  reasonCategory: ReasonCategory;
  details?: string;
}) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      reportedUserId: data.reportedUserId,
      targetType: data.targetType,
      targetId: data.targetId,
      postId: data.targetType === TargetType.POST ? data.targetId : null,
      groupId: data.targetType === TargetType.GROUP ? data.targetId : null,
      reasonCategory: data.reasonCategory,
      details: data.details,
      status: ReportStatus.OPEN,
    },
  });

  return report;
}

// Export audit log getter for admin usage
export async function getAdminAuditTrail(limit = 50) {
  await requireAdminPermission("VIEW_AUDIT_LOGS");
  return getAuditLogs(limit);
}

// ==========================================
// 6. Club System Backend Workflow
// ==========================================

export async function submitClubApplication(data: {
  name: string;
  description: string;
  category?: string;
  logoUrl?: string;
  bannerUrl?: string;
}) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const club = await prisma.club.create({
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      logoUrl: data.logoUrl,
      bannerUrl: data.bannerUrl,
      applicantId: user.id,
      status: "PENDING",
    },
  });

  // Create initial owner membership record
  await prisma.clubMember.create({
    data: {
      clubId: club.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  return club;
}

export async function reviewClubApplication(
  clubId: string,
  action: "APPROVE" | "REJECT",
  rejectReason?: string
) {
  const admin = await requireAdminPermission("MANAGE_CLUBS");

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new Error("Club not found");

  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updatedClub = await prisma.club.update({
    where: { id: clubId },
    data: {
      status: newStatus,
      reviewedById: admin.id,
      reviewedAt: new Date(),
      rejectReason: action === "REJECT" ? rejectReason : null,
    },
  });

  // Create notification for applicant
  await createNotification({
    userId: club.applicantId,
    type: "CLUB_APPROVAL",
    title: action === "APPROVE" ? "Club Application Approved!" : "Club Application Rejected",
    message: action === "APPROVE"
      ? `Congratulations! Your club "${club.name}" has been approved and is now official.`
      : `Your application for "${club.name}" was not approved. Reason: ${rejectReason || "Does not meet guidelines."}`,
    isUrgent: false,
  });

  await logAuditAction({
    adminId: admin.id,
    action: `CLUB_${action}`,
    targetType: TargetType.CLUB,
    targetId: clubId,
    details: { clubName: club.name, action, rejectReason },
  });

  return updatedClub;
}

export async function toggleClubRestriction(clubId: string, isRestricted: boolean) {
  const admin = await requireAdminPermission("MANAGE_CLUBS");

  const updatedClub = await prisma.club.update({
    where: { id: clubId },
    data: { isRestricted },
  });

  await logAuditAction({
    adminId: admin.id,
    action: isRestricted ? "RESTRICT_CLUB" : "UNRESTRICT_CLUB",
    targetType: TargetType.CLUB,
    targetId: clubId,
  });

  return updatedClub;
}

export async function joinClub(clubId: string) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club || club.status !== "APPROVED" || club.isRestricted) {
    throw new Error("Club is unavailable or restricted.");
  }

  const membership = await prisma.clubMember.create({
    data: {
      clubId,
      userId: user.id,
      role: "MEMBER",
    },
  });

  return membership;
}

export async function leaveClub(clubId: string) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  return prisma.clubMember.delete({
    where: {
      clubId_userId: { clubId, userId: user.id },
    },
  });
}

// ==========================================
// 7. Groups End-to-End Verification & Actions
// ==========================================

export async function createGroup(
  name: string,
  description?: string,
  category?: string,
  campus?: string
) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  if (user.banned) throw new Error("Account suspended. Cannot create groups.");

  if (!name || name.trim().length < 2) {
    throw new Error("Group name must be at least 2 characters.");
  }

  // Concurrency-safe interactive transaction for quota enforcement (max 3 active groups)
  return await prisma.$transaction(async (tx) => {
    const ownedActiveCount = await tx.group.count({
      where: {
        ownerId: user.id,
        isArchived: false,
      },
    });

    const isPrivilegedAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (ownedActiveCount >= 3 && !isPrivilegedAdmin) {
      throw new Error(
        "You have reached the maximum 3 active groups creation quota. Archive an existing group to create a new one."
      );
    }

    const group = await tx.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category || "General Peer",
        campus: campus || "All AAU Campuses",
        ownerId: user.id,
      },
    });

    // Automatically add owner as group member with ADMIN role
    await tx.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: "ADMIN",
      },
    });

    return group;
  });
}


export async function joinGroup(groupId: string) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  if (user.banned) throw new Error("Account suspended. Cannot join groups.");

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.isArchived) {
    throw new Error("Group does not exist or has been archived.");
  }
  if (group.isRestricted) {
    throw new Error("Group is currently restricted by moderation.");
  }
  if (group.isDelisted) {
    throw new Error("Group is removed from public discovery and cannot accept new members.");
  }

  // Joining someone else's group creates a member record (does NOT consume creator quota)
  return prisma.groupMember.upsert({
    where: {
      groupId_userId: { groupId, userId: user.id },
    },
    create: {
      groupId,
      userId: user.id,
      role: "MEMBER",
    },
    update: {},
  });
}

export async function leaveGroup(groupId: string) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Group not found");

  if (group.ownerId === user.id) {
    throw new Error("Group owners cannot leave their own group. Archive or disband the group instead.");
  }

  return prisma.groupMember.delete({
    where: {
      groupId_userId: { groupId, userId: user.id },
    },
  });
}

export async function archiveUserGroup(groupId: string) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Group not found");

  if (group.ownerId !== user.id && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    throw new Error("Only the group creator or an administrator can archive this group.");
  }

  return prisma.group.update({
    where: { id: groupId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  });
}

export async function assertCanSendGroupMessage(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { where: { userId } },
    },
  });

  if (!group || group.isArchived) {
    throw new Error("Group does not exist or has been archived.");
  }
  if (group.isRestricted) {
    throw new Error("Group is currently restricted by administration.");
  }

  // Check 48h (or custom) freeze with auto-expiration
  if (group.frozenUntil && new Date(group.frozenUntil) > new Date()) {
    throw new Error(
      `Group chat is frozen by administration until ${new Date(group.frozenUntil).toLocaleString()}. Reason: ${group.freezeReason || "Safety review"}`
    );
  }

  if (group.members.length === 0) {
    throw new Error("You must be a member of this group to send messages.");
  }

  return true;
}

export async function getPublicDiscoverGroups(campus?: string) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();

  const groups = await prisma.group.findMany({
    where: {
      isArchived: false,
      isDelisted: false,
      isRestricted: false,
      ...(campus && campus !== "All AAU Campuses" ? { campus } : {}),
    },
    include: {
      owner: {
        select: {
          id: true,
          displayName: true,
          email: true,
          department: true,
        },
      },
      members: user
        ? {
            where: { userId: user.id },
            select: { id: true, userId: true, role: true },
          }
        : false,
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    category: g.category,
    campus: g.campus,
    isRestricted: g.isRestricted,
    memberCount: g._count.members,
    joined: Boolean(user && g.members && (g.members as any[]).length > 0),
    ownerName: g.owner?.displayName || g.owner?.email?.split("@")[0] || "Student",
  }));
}

export async function getUpcomingEvents(limit = 10, category?: string) {
  const where: any = {
    contentType: "EVENT",
    status: "PUBLISHED",
  };
  if (category && category !== "All") {
    where.eventCategory = category;
  }
  return prisma.post.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          email: true,
          department: true,
          role: true,
        },
      },
      club: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { isPinned: "desc" },
      { isFeatured: "desc" },
      { startDate: "asc" },
      { publishedAt: "desc" },
    ],
    take: limit,
  });
}


export async function toggleGroupRestriction(groupId: string, isRestricted: boolean) {
  const admin = await requireAdminPermission("MANAGE_GROUPS");

  const group = await prisma.group.update({
    where: { id: groupId },
    data: { isRestricted },
  });

  await logAuditAction({
    adminId: admin.id,
    action: isRestricted ? "RESTRICT_GROUP" : "UNRESTRICT_GROUP",
    targetType: TargetType.GROUP,
    targetId: groupId,
  });

  return group;
}

export async function getUserGroups() {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) return [];

  return prisma.group.findMany({
    where: {
      isArchived: false,
      members: {
        some: { userId: user.id },
      },
    },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ==========================================
// 8. Notifications Backend Foundation
// ==========================================

export async function createNotification(data: {
  userId: string;
  type: "SYSTEM" | "POST_READY_APPROVAL" | "CLUB_APPROVAL" | "MODERATION" | "URGENT" | "ADMIN_ALERT";
  title: string;
  message: string;
  isUrgent?: boolean;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      isUrgent: data.isUrgent ?? false,
      link: data.link,
    },
  });
}

export async function getUserNotifications(limit = 20) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) return [];

  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationAsRead(notificationId: string) {
  const { getSessionUser } = await import("@/lib/auth");
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  return prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true },
  });
}
