"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChatSidebar, ConversationView } from "@/components/chat";
import type { GroupItem, FriendRequestItem } from "@/components/chat";
import type { ChatMessageRecord } from "@/lib/chatService";
import { MessageSquare } from "lucide-react";
import { joinGroupAction, acceptFriendRequestAction, declineFriendRequestAction } from "./actions";
import { AppMenu } from "@/components/AppMenu";
import { cn } from "@/lib/utils";

interface ChatPageClientProps {
  initialPersonalChats: GroupItem[];
  initialGroups: GroupItem[];
  initialSuggestedGroups: GroupItem[];
  initialPendingRequests?: FriendRequestItem[];
  currentUser: {
    id: string;
    displayName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
  initialMessages?: ChatMessageRecord[];
  initialSelectedChatId?: string | null;
}

/**
 * Client component for the /app/chat route.
 * Renders the live personal chats, joined groups, and suggested groups synced with PostgreSQL.
 * Implements mobile-first responsive master-detail navigation:
 *  - On mobile (< md): Shows conversation list initially; tapping a chat opens full-screen conversation with Back button.
 *  - On desktop (>= md): Shows split-view sidebar and active conversation side-by-side.
 */
export default function ChatPageClient({
  initialPersonalChats = [],
  initialGroups = [],
  initialSuggestedGroups = [],
  initialPendingRequests = [],
  currentUser,
  initialMessages = [],
  initialSelectedChatId = null,
}: ChatPageClientProps) {
  const searchParams = useSearchParams();
  const urlChatId = searchParams.get("chatId");
  const urlTab = (searchParams.get("tab") as "personal" | "group") || (urlChatId ? "personal" : undefined);

  const [personalChats, setPersonalChats] = useState<GroupItem[]>(initialPersonalChats);
  const [groups, setGroups] = useState<GroupItem[]>(initialGroups);
  const [suggestedGroups, setSuggestedGroups] = useState<GroupItem[]>(initialSuggestedGroups);
  const [pendingRequests, setPendingRequests] = useState<FriendRequestItem[]>(initialPendingRequests);
  
  // Track whether mobile viewport is currently viewing an active conversation
  const [isMobileViewingChat, setIsMobileViewingChat] = useState<boolean>(() => Boolean(urlChatId));

  const [selectedChat, setSelectedChat] = useState<GroupItem | null>(() => {
    if (initialSelectedChatId) {
      const match = initialPersonalChats.find((c) => c.id === initialSelectedChatId) || initialGroups.find((g) => g.id === initialSelectedChatId);
      if (match) return match;
    }
    if (urlChatId) {
      const match = initialPersonalChats.find((c) => c.id === urlChatId) || initialGroups.find((g) => g.id === urlChatId);
      if (match) return match;
    }
    // If user has joined groups, default select the first one, or first personal chat
    if (initialGroups.length > 0) return initialGroups[0];
    if (initialPersonalChats.length > 0) return initialPersonalChats[0];
    return null;
  });

  useEffect(() => {
    if (urlChatId) {
      const match = personalChats.find((c) => c.id === urlChatId) || groups.find((g) => g.id === urlChatId);
      if (match) {
        setSelectedChat(match);
        setIsMobileViewingChat(true);
        // Clear unread badge locally for this chat
        setPersonalChats((prev) =>
          prev.map((c) => (c.id === urlChatId ? { ...c, unreadCount: 0 } : c))
        );
      }
    }
  }, [urlChatId]);

  const handleChatClick = async (item: GroupItem) => {
    // Check if this item is in suggested groups (needs joining)
    const isSuggested = suggestedGroups.some((g) => g.id === item.id);
    if (isSuggested) {
      try {
        await joinGroupAction(item.id);
        // Move from suggested to groups
        setSuggestedGroups((prev) => prev.filter((g) => g.id !== item.id));
        setGroups((prev) => [item, ...prev]);
        setSelectedChat(item);
        setIsMobileViewingChat(true);
        return;
      } catch (err) {
        console.error("Failed to join group:", err);
      }
    }

    setSelectedChat(item);
    setIsMobileViewingChat(true);
  };

  const handleCreateGroup = () => {
    const groupName = window.prompt("Enter new group name:");
    if (!groupName || !groupName.trim()) return;

    // Direct redirect or toast for group creation
    window.location.href = `/home?createGroup=${encodeURIComponent(groupName.trim())}`;
  };

  const handleMessageSent = (chatId: string, text: string) => {
    // Update preview in the sidebar list
    const updateList = (list: GroupItem[]) =>
      list.map((c) =>
        c.id === chatId ? { ...c, lastMessage: text, lastMessageTime: "just now" } : c
      );

    setPersonalChats(updateList);
    setGroups(updateList);
  };

  const handleAcceptRequest = async (requestId: string) => {
    const target = pendingRequests.find((r) => r.id === requestId);
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    try {
      const res = await acceptFriendRequestAction(requestId);
      if (res.success && target) {
        setPersonalChats((prev) => [
          {
            id: target.senderId,
            name: target.senderName,
            avatarUrl: target.senderAvatar,
            kind: "personal",
            lastMessage: "Connected as friends",
            lastMessageTime: "just now",
          },
          ...prev,
        ]);
      } else if (!res.success && target) {
        setPendingRequests((prev) => [target, ...prev]);
      }
    } catch (err) {
      console.error("Failed to accept friend request:", err);
      if (target) {
        setPendingRequests((prev) => [target, ...prev]);
      }
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const target = pendingRequests.find((r) => r.id === requestId);
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    try {
      const res = await declineFriendRequestAction(requestId);
      if (!res.success && target) {
        setPendingRequests((prev) => [target, ...prev]);
      }
    } catch (err) {
      console.error("Failed to decline friend request:", err);
      if (target) {
        setPendingRequests((prev) => [target, ...prev]);
      }
    }
  };

  return (
    <div className="flex flex-col w-full h-full items-center overflow-hidden">
      {/* Dynamic Header & Navigation — passes isActiveChat on mobile */}
      <AppMenu isActiveChat={isMobileViewingChat} />

      <div className="flex-1 flex w-full max-w-[1340px] h-full overflow-hidden gap-0 justify-center">
        {/* ── Left Sidebar (List) ─────────────────────────────────────────── */}
        <div
          className={cn(
            "h-full overflow-hidden transition-all",
            isMobileViewingChat
              ? "hidden md:block md:w-[325px] shrink-0 md:py-4 md:pl-4 md:pr-3"
              : "w-full md:w-[325px] shrink-0 pt-16 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] px-3 sm:px-4 md:pt-4 md:pb-4 md:pl-4 md:pr-3"
          )}
        >
          <ChatSidebar
            personalChats={personalChats}
            groups={groups}
            suggestedGroups={suggestedGroups}
            pendingRequests={pendingRequests}
            initialTab={urlTab ?? "personal"}
            onGroupClick={handleChatClick}
            onCreateGroup={handleCreateGroup}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
          />
        </div>

        {/* ── Main Content Area (Detail) ─────────────────────────────────────── */}
        <div
          className={cn(
            "h-full overflow-hidden transition-all",
            isMobileViewingChat
              ? "flex-1 flex items-center justify-center w-full p-0 md:py-4 md:pr-4"
              : "hidden md:flex flex-1 items-center justify-center py-4 pr-4"
          )}
        >
          {selectedChat ? (
            /* Full conversation panel — name & avatar come from the clicked item */
            <ConversationView
              chat={selectedChat}
              currentUserId={currentUser.id}
              onMessageSent={handleMessageSent}
              onBack={() => setIsMobileViewingChat(false)}
              initialMessages={selectedChat.id === initialSelectedChatId ? initialMessages : undefined}
            />
          ) : (
            /* Empty state — shown before any chat is selected */
            <div className="text-center flex flex-col items-center animate-in fade-in duration-500">
              <div className="h-20 w-20 rounded-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md shadow-lg border border-zinc-200/50 dark:border-zinc-700/40 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 mb-1.5">
                Select a conversation
              </h2>
              <p className="text-[14px] font-medium text-zinc-500 dark:text-zinc-400 max-w-[280px] leading-relaxed">
                Choose a chat or join a group to begin messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
