"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { GroupItem } from "@/components/chat/types";

interface HomeFriendsStoriesProps {
  currentUser?: {
    id?: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
  friends?: GroupItem[];
}

export function HomeFriendsStories({
  currentUser,
  friends = [],
}: HomeFriendsStoriesProps) {
  const router = useRouter();
  const [friendsList, setFriendsList] = useState<GroupItem[]>(friends);

  useEffect(() => {
    setFriendsList(friends);
  }, [friends]);

  // ── Polling configuration ───────────────────────────────────────────────────
  const POLL_INTERVAL_MS = 60000; // 60 seconds while page is active & visible
  const MIN_REFRESH_INTERVAL_MS = 30000; // Throttle: don't re-poll more often than every 30s on focus

  const isFetchingRef = React.useRef(false);
  const lastFetchTimeRef = React.useRef(Date.now());
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timerId: NodeJS.Timeout | null = null;

    const fetchFriends = async () => {
      // Guard: avoid overlapping requests
      if (isFetchingRef.current) return;
      // Guard: do not poll while document is hidden in background
      if (typeof document !== "undefined" && document.hidden) return;

      isFetchingRef.current = true;
      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat/friend?list=full", {
          signal: abortControllerRef.current.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.friends)) {
            setFriendsList(data.friends);
            lastFetchTimeRef.current = Date.now();
          }
        }
      } catch (err: any) {
        // Ignore aborted requests or background poll network failures
        if (err?.name !== "AbortError") {
          // silently handle transient poll errors
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    const startTimer = () => {
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        fetchFriends();
      }, POLL_INTERVAL_MS);
    };

    const stopTimer = () => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    // Visibility change handler: pause polling when hidden, resume & refresh when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
        // Cancel in-flight request if user hid the tab
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      } else {
        // Tab became visible again: refresh if stale (> 30s since last fetch)
        const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        if (timeSinceLastFetch >= MIN_REFRESH_INTERVAL_MS) {
          fetchFriends();
        }
        startTimer();
      }
    };

    // Window focus handler: refresh if returning to window and data is stale
    const handleFocus = () => {
      if (!document.hidden) {
        const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
        if (timeSinceLastFetch >= MIN_REFRESH_INTERVAL_MS) {
          fetchFriends();
        }
      }
    };

    // Start polling timer on mount
    startTimer();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      stopTimer();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleFriendClick = (friendId: string) => {
    // Navigate directly to the personal conversation in chat
    router.push(`/app/chat?chatId=${encodeURIComponent(friendId)}&tab=personal`);
  };

  // Get a compact display name (e.g. first name or short name)
  const getShortName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return "Student";
    const parts = trimmed.split(/[\s_-]+/);
    return parts[0].length > 10 ? `${parts[0].slice(0, 9)}…` : parts[0];
  };

  return (
    <section className="w-full select-none" aria-label="Friends">
      <div className="rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.04)] dark:shadow-[0_4px_30px_-4px_rgba(0,0,0,0.3)] bg-white/80 dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)]/90 backdrop-blur-xl border border-[#e2e8f0] dark:border-white/10 px-5 sm:px-7 py-4.5 transition-all duration-300">
        <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar py-1">
          {/* Friends */}
          {friendsList.map((friend) => {
            const unreadCount = friend.unreadCount ?? 0;
            const hasUnread = unreadCount > 0;
            const shortName = getShortName(friend.name);

            return (
              <motion.div
                key={friend.id}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFriendClick(friend.id)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0 relative"
                title={`${friend.name}${hasUnread ? ` (${unreadCount} new message)` : ""}`}
              >
                {/* Avatar with ice blue and white gradient ring */}
                <div className="relative">
                  {/* Outer Gradient Ring in ice blue and white matching the site */}
                  <div
                    className={`p-[2.5px] rounded-full transition-all duration-300 ${
                      hasUnread
                        ? "bg-gradient-to-tr from-[#0284c7] via-[#38bdf8] to-white shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                        : "bg-gradient-to-tr from-[#38bdf8] via-[#a5f3fc] to-white opacity-90 group-hover:opacity-100 group-hover:shadow-[0_0_12px_rgba(56,189,248,0.35)]"
                    }`}
                  >
                    {/* Gap spacer between avatar and gradient border */}
                    <div className="p-[2.5px] rounded-full bg-white dark:bg-[#18181f] transition-colors">
                      <div className="w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center relative">
                        {friend.avatarUrl ? (
                          <img
                            src={friend.avatarUrl}
                            alt={friend.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-108"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-base font-bold text-zinc-700 dark:text-zinc-200">
                            {friend.name[0]?.toUpperCase() || "S"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Red Circle Badge showing unread count - static number, no blinking */}
                  {hasUnread && (
                    <div
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 min-w-[20px] h-[20px] px-1 bg-[#ef4444] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(239,68,68,0.5)] ring-2 ring-white dark:ring-[#18181f] z-20 pointer-events-none"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </div>
                  )}
                </div>

                {/* Friend Name */}
                <div className="flex flex-col items-center">
                  <span className="text-[12.5px] font-medium tracking-tight text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors text-center max-w-[80px] truncate">
                    {shortName}
                  </span>
                </div>
              </motion.div>
            );
          })}

          {/* Friendly prompt if no friends yet */}
          {friendsList.length === 0 && (
            <div className="flex items-center gap-3 pl-2 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              <span>No friends added yet. Connect with classmates in Video Chat!</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
