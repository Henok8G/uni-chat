import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DEFAULT_THEME_COLOR, getThemeGradient } from "@/lib/themes";
import ChatPageClient from "./ChatPageClient";
import {
  getPersonalChatsForUser,
  getJoinedGroupsForUser,
  getSuggestedGroupsForUser,
  getConversationMessages,
  getReceivedFriendRequests,
  ChatMessageRecord,
} from "@/lib/chatService";
import type { GroupItem, FriendRequestItem } from "@/components/chat";

export const dynamic = "force-dynamic";

interface ChatPageProps {
  searchParams?: Promise<{ chatId?: string; tab?: string }> | { chatId?: string; tab?: string };
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  if (!user.emailVerified || user.banned) {
    redirect("/auth/login?error=Please+verify+your+email+or+contact+support.");
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const urlChatId = resolvedParams?.chatId;

  const [personalChats, groups, suggestedGroups, pendingRequests] = await Promise.all([
    getPersonalChatsForUser(user.id),
    getJoinedGroupsForUser(user.id),
    getSuggestedGroupsForUser(user.id),
    getReceivedFriendRequests(user.id),
  ]);

  // Determine initial selected conversation with strict access validation
  let defaultChat: GroupItem | null = null;
  if (urlChatId) {
    defaultChat =
      personalChats.find((c) => c.id === urlChatId) ||
      groups.find((g) => g.id === urlChatId) ||
      null;
  }

  if (!defaultChat) {
    if (groups.length > 0) defaultChat = groups[0];
    else if (personalChats.length > 0) defaultChat = personalChats[0];
  }

  // Prefetch messages for the default selected conversation on the server
  let initialMessages: ChatMessageRecord[] = [];
  if (defaultChat) {
    const rawMessages = await getConversationMessages(
      user.id,
      defaultChat.id,
      (defaultChat.kind as "personal" | "group") || "personal"
    );

    // If personal chat was marked read, clear badge in personalChats list
    if (defaultChat.kind === "personal" && defaultChat.unreadCount) {
      defaultChat.unreadCount = 0;
    }

    // Serialize createdAt to ISO string for safe Client Component boundary transfer
    initialMessages = rawMessages.map((m) => ({
      ...m,
      createdAt: typeof m.createdAt === "string" ? m.createdAt : m.createdAt.toISOString(),
    }));
  }

  const themeColor = user.themeColor ?? DEFAULT_THEME_COLOR;
  const bgGradient = getThemeGradient(themeColor, user.gender);

  return (
    <div
      className="flex h-screen flex-col items-center overflow-hidden"
      style={{ background: bgGradient }}
    >
      <ChatPageClient
        initialPersonalChats={personalChats}
        initialGroups={groups}
        initialSuggestedGroups={suggestedGroups}
        initialPendingRequests={pendingRequests}
        currentUser={{
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          avatarUrl: user.avatarUrl,
        }}
        initialMessages={initialMessages}
        initialSelectedChatId={defaultChat ? defaultChat.id : null}
      />
    </div>
  );
}

