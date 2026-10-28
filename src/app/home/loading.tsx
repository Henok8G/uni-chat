import React from "react";
import { AppMenuSkeleton } from "@/components/AppMenuSkeleton";
import { TrendingUp, Search, Compass, Heart, MessageSquare, Share2, Bookmark } from "lucide-react";

/**
 * Lightweight instant loading state for the Home route (/home).
 * Replicates the home feed layout (stories, filter chips, post cards, discovery sidebar)
 * with zero database queries to ensure immediate navigation feedback and no layout shifts.
 */
export default function HomeLoading() {
  return (
    <div
      className="min-h-screen flex flex-col items-center pb-24 relative overflow-x-hidden font-sf-pro"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading AAU Campus Feed"
    >
      <span className="sr-only">Loading AAU Campus Feed and campus stories...</span>

      {/* Shared Navigation Header Skeleton */}
      <AppMenuSkeleton activeTab="Home" />

      {/* Main Page Container */}
      <main className="w-full max-w-[1240px] flex flex-col items-start gap-5 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8">
        {/* Page Section Title */}
        <section className="w-full flex items-center justify-between py-0 px-2 box-border text-left font-sf-pro">
          <div className="flex items-center gap-2.5">
            <h1 className="m-0 text-[28px] sm:text-[32px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
              Home
            </h1>
          </div>
        </section>

        {/* ── Friends Stories Section Skeleton ── */}
        <div className="w-full rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] border-[#e2e8f0] dark:border-white/10 border-solid border-[1px] p-4 sm:p-5 flex items-center gap-4 overflow-x-hidden select-none">
          {/* Friend stories placeholders */}
          {[1, 2, 3, 4, 5, 6, 7].map((idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700/60 p-1 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
              <div className="h-3 w-14 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70 motion-safe:animate-pulse motion-reduce:animate-none" />
            </div>
          ))}
        </div>

        {/* ── Content Layout Grid ── */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Main Feed Column (lg:col-span-8) */}
          <section className="lg:col-span-8 space-y-5 w-full">
            {/* Header Card Skeleton */}
            <div className="rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] border-[#e2e8f0] dark:border-white/10 border-solid border-[1px] p-5 sm:p-6">
              <div className="space-y-2">
                <div className="h-6 w-56 rounded-full bg-zinc-200/80 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none" />
                <div className="h-3.5 w-3/4 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>

              {/* Filter Chips & Search Bar Skeleton */}
              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {["w-12", "w-24", "w-16", "w-14", "w-24"].map((w, i) => (
                    <div
                      key={i}
                      className={`h-7 ${w} rounded-full bg-zinc-200/70 dark:bg-zinc-800/70 motion-safe:animate-pulse motion-reduce:animate-none`}
                    />
                  ))}
                </div>
                <div className="h-7 w-full sm:w-56 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/50 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
            </div>

            {/* Trending Discovery Bar Skeleton */}
            <div className="rounded-[22px] border border-zinc-200/70 dark:border-white/10 bg-white/70 dark:bg-[color-mix(in_srgb,var(--theme-accent)_4%,rgba(24,24,31,0.7))] backdrop-blur-md p-3 sm:px-4 flex items-center gap-2.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0 font-sf-pro">
                <TrendingUp className="w-3.5 h-3.5 text-[#4A7BB0]/60" />
                <div className="h-3 w-28 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
              <div className="flex items-center gap-2 overflow-hidden w-full">
                {["w-20", "w-24", "w-18", "w-28"].map((w, i) => (
                  <div
                    key={i}
                    className={`h-6 ${w} rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none shrink-0`}
                  />
                ))}
              </div>
            </div>

            {/* Feed Post Card Skeletons (2 items) */}
            {[1, 2].map((postIdx) => (
              <article
                key={postIdx}
                className="rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] border-[#e2e8f0] dark:border-white/10 border-solid border-[1px] p-5 sm:p-6 space-y-4"
              >
                {/* Source Header Skeleton */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-200/80 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none shrink-0" />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-3.5 w-32 rounded-full bg-zinc-200/80 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none" />
                        <div className="h-4 w-20 rounded-full bg-blue-100/60 dark:bg-blue-900/40 motion-safe:animate-pulse motion-reduce:animate-none" />
                      </div>
                      <div className="h-2.5 w-24 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                    </div>
                  </div>
                  <div className="h-5 w-24 rounded-full bg-indigo-50/80 dark:bg-indigo-950/40 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>

                {/* Headline Skeleton */}
                <div className="h-5 w-3/4 rounded-full bg-zinc-200/80 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none" />

                {/* Body Lines Skeleton */}
                <div className="space-y-2">
                  <div className="h-3.5 w-full rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                  <div className="h-3.5 w-5/6 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                  <div className="h-3.5 w-2/3 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                </div>

                {/* Actions Bar Skeleton */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/70 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                      <div className="h-3 w-6 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                      <div className="h-3 w-6 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                    </div>
                  </div>
                  <Bookmark className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                </div>
              </article>
            ))}
          </section>

          {/* ── Right Discovery Sidebar Skeleton (Desktop lg:col-span-4) ── */}
          <aside className="lg:col-span-4 sticky top-6 hidden lg:block space-y-5 font-sf-pro">
            {/* Discover Groups Card Skeleton */}
            <div className="rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] border-[#e2e8f0] dark:border-white/10 border-solid border-[1px] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded-full bg-zinc-200/80 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-12 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((gIdx) => (
                  <div key={gIdx} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80 motion-safe:animate-pulse motion-reduce:animate-none shrink-0" />
                      <div className="space-y-1">
                        <div className="h-3 w-24 rounded-full bg-zinc-200/80 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none" />
                        <div className="h-2.5 w-16 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                      </div>
                    </div>
                    <div className="h-6 w-14 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events Card Skeleton */}
            <div className="rounded-[28px] shadow-[0px_4px_20px_rgba(0,_0,_0,_0.05)] bg-white dark:bg-[color-mix(in_srgb,var(--theme-accent)_6%,#18181f)] border-[#e2e8f0] dark:border-white/10 border-solid border-[1px] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded-full bg-zinc-200/80 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-12 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
              </div>
              <div className="space-y-3">
                {[1, 2].map((eIdx) => (
                  <div key={eIdx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80 motion-safe:animate-pulse motion-reduce:animate-none shrink-0" />
                    <div className="space-y-1 flex-1">
                      <div className="h-3 w-28 rounded-full bg-zinc-200/80 dark:bg-zinc-700/70 motion-safe:animate-pulse motion-reduce:animate-none" />
                      <div className="h-2.5 w-20 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 motion-safe:animate-pulse motion-reduce:animate-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
