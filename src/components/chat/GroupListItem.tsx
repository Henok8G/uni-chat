"use client";

import { motion } from "framer-motion";
import type { GroupItem } from "./types";

interface GroupListItemProps {
  group: GroupItem;
  onClick?: (group: GroupItem) => void;
  showDivider?: boolean;
}

/**
 * A single row in the group/chat list.
 * Renders an avatar (image or initials fallback) + name + last message preview +
 * timestamp + unread badge + online indicator dot.
 */
export function GroupListItem({ group, onClick, showDivider = true }: GroupListItemProps) {
  const initials = group.name
    .replace(/^#/, "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => onClick?.(group)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 group/item cursor-pointer"
      >
        {/* Avatar with online indicator */}
        <div className="relative w-10 h-10 shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center shadow-xs ring-1 ring-black/10 dark:ring-white/15">
            {group.avatarUrl ? (
              <img
                src={group.avatarUrl}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-200 select-none">
                {initials}
              </span>
            )}
          </div>
          {/* Online dot */}
          {group.isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#d4d4d8] dark:ring-zinc-800" />
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: name + timestamp */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[14px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              {group.name}
            </span>
            {group.lastMessageTime && (
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
                {group.lastMessageTime}
              </span>
            )}
          </div>
          {/* Row 2: last message + unread badge */}
          {group.lastMessage ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 truncate leading-tight">
                {group.lastMessage}
              </p>
              {group.unreadCount && group.unreadCount > 0 ? (
                <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-zinc-800 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold flex items-center justify-center">
                  {group.unreadCount > 99 ? "99+" : group.unreadCount}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </button>

      {/* Divider */}
      {showDivider && (
        <div className="mx-3 h-[1px] bg-zinc-400/40 dark:bg-zinc-700/60" />
      )}
    </div>
  );
}
