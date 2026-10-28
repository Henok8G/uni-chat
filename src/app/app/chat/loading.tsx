import React from "react";
import { AppMenuSkeleton } from "@/components/AppMenuSkeleton";
import { Search, Sparkles } from "lucide-react";

/**
 * Lightweight instant loading state for the Chat route (/app/chat).
 * Renders the structural skeleton of the chat sidebar and conversation panel
 * without triggering any database queries or layout shifts.
 */
export default function ChatLoading() {
  return (
    <div
      className="flex h-screen flex-col items-center bg-[var(--background)] font-sf-pro overflow-hidden"
      style={{
        background:
          "linear-gradient(225deg, var(--background) var(--gradient-bg-start, 0%), color-mix(in srgb, var(--theme-accent) var(--theme-opacity, 38%), transparent) var(--gradient-center-start, 50%), color-mix(in srgb, var(--theme-accent) var(--theme-opacity, 38%), transparent) var(--gradient-center-end, 50%), var(--background) var(--gradient-bg-end, 100%))",
      }}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading Uni-Chat conversations"
    >
      <span className="sr-only">Loading Uni-Chat conversations and messages...</span>

      {/* Top Navigation Menu Skeleton */}
      <AppMenuSkeleton activeTab="Chat" />

      {/* Main Chat Layout Area */}
      <div className="flex-1 flex w-full justify-center overflow-hidden">
        <div className="flex w-full max-w-[1340px] h-full overflow-hidden gap-0">
          {/* ── Left Sidebar Skeleton (Desktop) ── */}
          <div className="w-[325px] shrink-0 h-full py-4 pl-4 pr-3 overflow-hidden hidden md:flex flex-col gap-3.5 select-none">
            {/* Search Bar Skeleton */}
            <div className="relative">
              <div className="flex items-center gap-3 bg-[#d4d4d8]/85 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl border border-zinc-400/20 dark:border-zinc-700/40 px-3.5 py-2.5 shadow-xs">
                <Search className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0 stroke-[2]" />
                <div className="h-4 w-32 rounded-full bg-zinc-300/80 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
            </div>

            {/* Tab Pills Skeleton */}
            <div className="flex p-1 rounded-2xl bg-[#d4d4d8]/70 dark:bg-zinc-800/70 border border-zinc-400/20 dark:border-zinc-700/30 gap-1">
              <div className="flex-1 h-8 rounded-xl bg-white/70 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none flex items-center justify-center gap-1.5 px-3">
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-300/80 dark:bg-zinc-600/80" />
                <div className="w-14 h-3 rounded-full bg-zinc-300/80 dark:bg-zinc-600/80" />
              </div>
              <div className="flex-1 h-8 rounded-xl bg-transparent flex items-center justify-center gap-1.5 px-3">
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-300/60 dark:bg-zinc-700/60" />
                <div className="w-12 h-3 rounded-full bg-zinc-300/60 dark:bg-zinc-700/60" />
              </div>
            </div>

            {/* Conversation List Skeletons */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-2xl border border-transparent bg-white/30 dark:bg-zinc-800/30 backdrop-blur-xs"
                >
                  {/* Avatar Skeleton */}
                  <div className="w-11 h-11 rounded-full bg-zinc-300/80 dark:bg-zinc-700/70 shrink-0 motion-safe:animate-pulse motion-reduce:animate-none" />
                  {/* Name and preview line */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div
                        className="h-3.5 rounded-full bg-zinc-300/80 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none"
                        style={{ width: `${60 + (idx % 3) * 20}%` }}
                      />
                      <div className="h-2.5 w-8 rounded-full bg-zinc-300/60 dark:bg-zinc-700/50 motion-safe:animate-pulse motion-reduce:animate-none" />
                    </div>
                    <div
                      className="h-2.5 rounded-full bg-zinc-300/60 dark:bg-zinc-700/50 motion-safe:animate-pulse motion-reduce:animate-none"
                      style={{ width: `${45 + (idx % 2) * 30}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Groups Box Skeleton */}
            <div className="mt-auto p-3 rounded-2xl bg-[#d4d4d8]/60 dark:bg-zinc-800/60 border border-zinc-400/20 dark:border-zinc-700/30 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                <div className="h-3 w-28 rounded-full bg-zinc-300/80 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-zinc-300/80 dark:bg-zinc-700/70 shrink-0 motion-safe:animate-pulse motion-reduce:animate-none" />
                  <div className="h-3 w-24 rounded-full bg-zinc-300/70 dark:bg-zinc-700/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>
                <div className="h-6 w-12 rounded-lg bg-zinc-300/70 dark:bg-zinc-700/60 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          </div>

          {/* ── Main Conversation Panel Skeleton ── */}
          <div className="flex-1 flex items-center justify-center h-full py-4 pr-4 pl-4 md:pl-0">
            <div className="flex flex-col w-full h-full overflow-hidden rounded-3xl bg-zinc-400/50 dark:bg-zinc-700/60 backdrop-blur-2xl border border-zinc-300/40 dark:border-zinc-600/40 shadow-2xl font-sf-pro">
              {/* Header Skeleton */}
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-400/50 dark:border-zinc-500/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-300/80 dark:bg-zinc-600/80 motion-safe:animate-pulse motion-reduce:animate-none shrink-0" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-32 rounded-full bg-zinc-300/80 dark:bg-zinc-600/80 motion-safe:animate-pulse motion-reduce:animate-none" />
                    <div className="h-2.5 w-20 rounded-full bg-zinc-300/60 dark:bg-zinc-600/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-300/50 dark:bg-zinc-600/50 motion-safe:animate-pulse motion-reduce:animate-none" />
                  <div className="w-7 h-7 rounded-full bg-zinc-300/50 dark:bg-zinc-600/50 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>
              </div>

              {/* Messages Staggered Skeletons */}
              <div className="flex-1 overflow-hidden px-4 py-4 flex flex-col gap-3 justify-end custom-scrollbar">
                {/* Left Bubble (Received) */}
                <div className="max-w-[70%] sm:max-w-[55%] p-3.5 rounded-2xl rounded-tl-xs bg-white/70 dark:bg-zinc-800/70 border border-white/20 dark:border-zinc-700/30 space-y-2">
                  <div className="h-3 w-44 rounded-full bg-zinc-300/70 dark:bg-zinc-600/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                  <div className="h-3 w-28 rounded-full bg-zinc-300/70 dark:bg-zinc-600/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>

                {/* Right Bubble (Sent) */}
                <div className="max-w-[70%] sm:max-w-[55%] p-3.5 rounded-2xl rounded-tr-xs bg-[#4A7BB0]/30 dark:bg-[#4A7BB0]/25 border border-blue-300/20 dark:border-blue-700/20 ml-auto space-y-2">
                  <div className="h-3 w-48 rounded-full bg-zinc-300/70 dark:bg-zinc-600/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>

                {/* Left Bubble (Received) */}
                <div className="max-w-[70%] sm:max-w-[55%] p-3.5 rounded-2xl rounded-tl-xs bg-white/70 dark:bg-zinc-800/70 border border-white/20 dark:border-zinc-700/30 space-y-2">
                  <div className="h-3 w-56 rounded-full bg-zinc-300/70 dark:bg-zinc-600/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                  <div className="h-3 w-36 rounded-full bg-zinc-300/70 dark:bg-zinc-600/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>

                {/* Right Bubble (Sent) */}
                <div className="max-w-[70%] sm:max-w-[55%] p-3.5 rounded-2xl rounded-tr-xs bg-[#4A7BB0]/30 dark:bg-[#4A7BB0]/25 border border-blue-300/20 dark:border-blue-700/20 ml-auto space-y-2">
                  <div className="h-3 w-32 rounded-full bg-zinc-300/70 dark:bg-zinc-600/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>
              </div>

              {/* Bottom Input Bar Skeleton */}
              <div className="shrink-0 p-3 border-t border-zinc-400/40 dark:border-zinc-500/30 flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white/40 dark:bg-zinc-800/60 shrink-0 motion-safe:animate-pulse motion-reduce:animate-none" />
                <div className="h-10 flex-1 rounded-2xl bg-[#d4d4d8]/80 dark:bg-zinc-800/80 px-4 flex items-center">
                  <div className="h-3 w-36 rounded-full bg-zinc-300/70 dark:bg-zinc-600/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>
                <div className="w-9 h-9 rounded-full bg-[#4A7BB0]/40 shrink-0 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
