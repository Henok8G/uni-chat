import React from "react";
import { Home, Sparkles, Video, User, MessageSquare, Settings as SettingsIcon } from "lucide-react";

interface AppMenuSkeletonProps {
  activeTab?: "Home" | "Match" | "Vid Chat" | "Friends" | "Chat" | "Settings";
}

const MENU_ITEMS = [
  { icon: Home, label: "Home" },
  { icon: Sparkles, label: "Match" },
  { icon: Video, label: "Vid Chat" },
  { icon: User, label: "Friends" },
  { icon: MessageSquare, label: "Chat" },
  { icon: SettingsIcon, label: "Settings" },
];

/**
 * Lightweight static header skeleton for route loading states.
 * Replicates the exact dimensions, spacing, branding, and menu bar
 * of AppMenu without invoking any client hooks (useRouter/usePathname),
 * avoiding any layout shifts or SSR hydration crashes during route transitions.
 */
export function AppMenuSkeleton({ activeTab }: AppMenuSkeletonProps) {
  return (
    <div
      className="w-full z-50 absolute md:relative top-0 left-0"
      style={{
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <header className="flex w-full items-center justify-between px-6 sm:px-8 lg:px-12 py-3.5 sm:py-4 relative">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5 select-none shrink-0">
          <img
            src="/images/logo-icon.png"
            alt="Uni-Chat"
            width={36}
            height={36}
            className="w-9 h-9 rounded-xl object-contain shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50 font-sf-pro">
              Uni-Chat
            </span>
          </div>
        </div>

        {/* Center Pill Menu Bar Skeleton */}
        <div className="absolute left-1/2 -translate-x-1/2 mt-1 scale-100 origin-center whitespace-nowrap z-50 hidden md:block">
          <div className="h-12 px-2 inline-flex justify-center items-center gap-1.5 rounded-full bg-[var(--surface-alt)]/85 backdrop-blur-xl border border-[var(--border)]/60 shadow-lg shadow-black/5 dark:shadow-black/20">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                <div
                  key={item.label}
                  className={`relative h-10 rounded-full flex justify-center items-center transition-all select-none ${
                    isActive
                      ? "bg-[var(--foreground)] text-[var(--background)] px-3.5 shadow-xs"
                      : "text-[var(--muted)] px-3"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-medium font-sf-pro">{item.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Theme Toggle Skeleton */}
        <div className="flex items-center gap-3 ml-auto md:ml-0">
          <div className="h-10 w-10 rounded-full bg-white ring-1 ring-zinc-200/80 dark:bg-zinc-800/90 dark:ring-zinc-700/80 shadow-sm motion-safe:animate-pulse motion-reduce:animate-none" />
        </div>
      </header>
    </div>
  );
}
