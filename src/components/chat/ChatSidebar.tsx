"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FolderPlus, Users, MessageCircle, UserPlus, Check, X } from "lucide-react";
import type { GroupItem, FriendRequestItem } from "./types";
import { GroupListItem } from "./GroupListItem";
import { SuggestedGroups } from "./SuggestedGroups";

interface ChatSidebarProps {
  /** Personal (1-on-1) chats shown under the Personal tab */
  personalChats?: GroupItem[];
  /** Group chats shown under the Group tab */
  groups: GroupItem[];
  suggestedGroups: GroupItem[];
  pendingRequests?: FriendRequestItem[];
  initialTab?: "personal" | "group";
  onGroupClick?: (group: GroupItem) => void;
  onCreateGroup?: () => void;
  onAcceptRequest?: (requestId: string) => Promise<void> | void;
  onDeclineRequest?: (requestId: string) => Promise<void> | void;
}

/**
 * Left sidebar for the Chat view.
 * Contains search, Personal/Group tabs, chat list, and suggested groups.
 */
export function ChatSidebar({
  personalChats = [],
  groups,
  suggestedGroups,
  pendingRequests = [],
  initialTab = "personal",
  onGroupClick,
  onCreateGroup,
  onAcceptRequest,
  onDeclineRequest,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"personal" | "group">(initialTab);

  // Pick the source list based on the active tab
  const sourceList = activeTab === "personal" ? personalChats : groups;

  // Filter by search query
  const filteredList = sourceList.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggested = suggestedGroups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col gap-3.5 overflow-hidden select-none">
      {/* ── Search Bar ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative"
      >
        <div className="flex items-center gap-3 bg-[#d4d4d8]/85 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl border border-zinc-400/20 dark:border-zinc-700/40 px-3.5 py-2.5 shadow-xs focus-within:ring-2 focus-within:ring-zinc-400/50 dark:focus-within:ring-zinc-500/50 transition-all">
          <Search className="w-5 h-5 text-zinc-900 dark:text-zinc-100 shrink-0 stroke-[2.5]" />
          <input
            type="text"
            aria-label="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-600 dark:placeholder:text-zinc-400"
          />
        </div>
      </motion.div>

      {/* ── Main Group Card ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" }}
        className="flex-1 bg-[#d4d4d8]/85 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl border border-zinc-400/20 dark:border-zinc-700/40 shadow-xs flex flex-col overflow-hidden min-h-0"
      >
        {/* Tab Bar + Create/Folder Button */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div role="tablist" aria-label="Conversation category" className="flex items-center gap-4">
            {(["personal", "group"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab)}
                  className="relative pb-1 text-[15px] font-medium tracking-tight cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  <span
                    className={
                      isActive
                        ? "text-zinc-950 dark:text-white"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }
                  >
                    {tab === "personal" ? "Personal" : "Group"}
                  </span>
                  {/* Underline indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="chat-tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-950 dark:bg-white rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Create Group / Folder Button */}
          <button
            type="button"
            onClick={onCreateGroup}
            aria-label="Create group"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Create group"
          >
            <FolderPlus className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Chat / Group List */}
        <div className="flex-1 overflow-y-auto px-1.5 pb-2 min-h-0 custom-scrollbar">
          {/* Pending Friend Requests (shown under Personal tab) */}
          {activeTab === "personal" && pendingRequests && pendingRequests.length > 0 && (
            <div className="mb-2.5 p-2 rounded-xl bg-zinc-900/5 dark:bg-white/5 border border-zinc-400/25 dark:border-zinc-700/40 shadow-2xs">
              <div className="flex items-center justify-between px-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  <span className="text-[11.5px] font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                    Friend Requests
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {pendingRequests.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/70 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/50 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
                        {req.senderAvatar ? (
                          <img src={req.senderAvatar} alt={req.senderName} className="w-full h-full object-cover" />
                        ) : (
                          req.senderName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                          {req.senderName}
                        </p>
                        <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate leading-tight">
                          {req.senderDepartment || "Verified Student"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onAcceptRequest?.(req.id)}
                        className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                        title="Accept request"
                        aria-label={`Accept request from ${req.senderName}`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                      </button>
                      <button
                        onClick={() => onDeclineRequest?.(req.id)}
                        className="p-1 rounded-md bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                        title="Decline request"
                        aria-label={`Decline request from ${req.senderName}`}
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {filteredList.length > 0 ? (
              <motion.div
                key={`${activeTab}-list`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {filteredList.map((item, index) => (
                  <GroupListItem
                    key={item.id}
                    group={item}
                    onClick={onGroupClick}
                    showDivider={index < filteredList.length - 1}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center justify-center py-10 px-4 text-center h-full"
              >
                <div className="w-11 h-11 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-2.5">
                  {activeTab === "personal" ? (
                    <MessageCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  ) : (
                    <Users className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                  )}
                </div>
                <p className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200 mb-1">
                  {searchQuery
                    ? "No results found"
                    : activeTab === "personal"
                      ? "No chats yet"
                      : "No groups yet"}
                </p>
                <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[190px]">
                  {searchQuery
                    ? `No matches for "${searchQuery}"`
                    : activeTab === "personal"
                      ? "Start a conversation or join a group to see it here."
                      : "Create or join a group to get started."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Suggested Groups ──────────────────────────────────────── */}
      <SuggestedGroups items={filteredSuggested} onGroupClick={onGroupClick} />
    </div>
  );
}
