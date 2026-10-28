import React from "react";
import { AppMenuSkeleton } from "@/components/AppMenuSkeleton";

export default function MatchLoading() {
  return (
    <div
      className="min-h-screen flex flex-col items-center pb-24 relative overflow-x-hidden font-sf-pro bg-[var(--background)]"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading Matchmaking Hub"
    >
      <span className="sr-only">Loading Campus Matchmaking Hub...</span>

      {/* Header Skeleton */}
      <AppMenuSkeleton activeTab="Match" />

      {/* Main Skeleton */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-8 pb-16 flex flex-col gap-8 animate-pulse">
        {/* Hero Banner Skeleton */}
        <div className="w-full h-44 rounded-3xl bg-[var(--surface)] border border-black/5 dark:border-white/10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Controls Skeleton */}
          <div className="lg:col-span-7 space-y-6">
            <div className="h-20 rounded-2xl bg-[var(--surface)]" />
            <div className="h-96 rounded-3xl bg-[var(--surface)]" />
          </div>

          {/* Right Radar Skeleton */}
          <div className="lg:col-span-5 space-y-6">
            <div className="h-96 rounded-3xl bg-[var(--surface)] flex flex-col items-center justify-center p-8">
              <div className="w-64 h-64 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
