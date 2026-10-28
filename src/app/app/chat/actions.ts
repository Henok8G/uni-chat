"use server";

import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  getPersonalChatsForUser,
  getJoinedGroupsForUser,
  getSuggestedGroupsForUser,
  addFriend,
  getConversationMessages,
  sendChatMessage,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
} from "@/lib/chatService";
import { joinGroup as joinGroupDb } from "@/app/admin/backendActions";
import type { GroupItem } from "@/components/chat/types";

export async function getChatSidebarData() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const [personalChats, groups, suggestedGroups] = await Promise.all([
    getPersonalChatsForUser(user.id),
    getJoinedGroupsForUser(user.id),
    getSuggestedGroupsForUser(user.id),
  ]);

  return {
    personalChats,
    groups,
    suggestedGroups,
    currentUser: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  };
}

export async function sendFriendRequestAction(receiverId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await sendFriendRequest(user.id, receiverId);
  revalidatePath("/app/chat");
  return result;
}

export async function acceptFriendRequestAction(requestId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await acceptFriendRequest(requestId, user.id);
  revalidatePath("/app/chat");
  return result;
}

export async function declineFriendRequestAction(requestId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await declineFriendRequest(requestId, user.id);
  revalidatePath("/app/chat");
  return result;
}

export async function cancelFriendRequestAction(requestId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await cancelFriendRequest(requestId, user.id);
  revalidatePath("/app/chat");
  return result;
}

export async function getFriendRequestsAction() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const [received, sent] = await Promise.all([
    getReceivedFriendRequests(user.id),
    getSentFriendRequests(user.id),
  ]);

  return { received, sent };
}

export async function addFriendAction(friendId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const result = await sendFriendRequest(user.id, friendId);
  revalidatePath("/app/chat");
  return result;
}

export async function joinGroupAction(groupId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await joinGroupDb(groupId);
  revalidatePath("/app/chat");
  revalidatePath("/home");
  return { success: true };
}

export async function fetchConversationMessagesAction(
  targetId: string,
  kind: "personal" | "group"
) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return getConversationMessages(user.id, targetId, kind);
}

export async function sendChatMessageAction(
  targetId: string,
  kind: "personal" | "group",
  text: string
) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const msg = await sendChatMessage(user.id, targetId, kind, text);
  revalidatePath("/app/chat");
  return msg;
}
