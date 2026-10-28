"use client";

import { useEffect, useState } from "react";
import { MenuBar } from "@/components/ui/bottom-menu";
import { Moon, Sun, Video, User, MessageSquare, Settings as SettingsIcon, CreditCard, Home, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "@/app/profile/actions";
import { cn } from "@/lib/utils";

import Link from "next/link";
import Image from "next/image";

import { toggleThemeMode } from "@/lib/themeTransition";

const getDesktopMenuItems = (currentPath: string) => [
  { icon: Home, label: "Home", href: "/home" },
  { icon: Sparkles, label: "Match", href: "/match" },
  { icon: Video, label: "Vid Chat", href: "/app" },
  { icon: User, label: "Friends", href: "/profile" },
  { icon: MessageSquare, label: "Chat", href: "/app/chat" },
  { icon: SettingsIcon, label: "Settings", href: "/settings" }
];

const getMobileMenuItems = (currentPath: string) => [
  { icon: Home, label: "Home", href: "/home" },
  { icon: Sparkles, label: "Match", href: "/match" },
  { icon: Video, label: "Video", href: "/app" },
  { icon: MessageSquare, label: "Chat", href: "/app/chat" },
  { icon: SettingsIcon, label: "Settings", href: "/settings" },
  { icon: User, label: "Profile", href: "/profile" }
];

export function AppMenu({ isActiveChat = false }: { isActiveChat?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Sync from localStorage (the DarkModeScript already applied the class,
    // but we need to initialize local state to match)
    const stored = localStorage.getItem("theme");
    const dark = stored === "dark" || document.documentElement.classList.contains("dark");
    setIsDark(dark);
    // Ensure the class is applied (redundant safety)
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const toggleTheme = (e: React.MouseEvent) => {
    const next = !isDark;
    toggleThemeMode(next, e, () => {
      setIsDark(next);
    });
  };


  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAction();
    } catch (e) {
      // Ignored
    }
    router.push("/");
  };

  return (
    <>
    <div className={cn("w-full z-50 absolute md:relative top-0 left-0", isActiveChat && "hidden md:block")} style={{ paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }}>
      <header className="flex w-full items-center justify-between px-6 sm:px-8 lg:px-12 py-3.5 sm:py-4 relative">
        <Link
          href="/home"
          className="flex items-center gap-2.5 group select-none shrink-0"
          title="Uni-Chat Home"
        >
          <Image
            src="/images/logo-icon.png"
            alt="Uni-Chat"
            width={36}
            height={36}
            quality={75}
            className="w-9 h-9 rounded-xl object-contain shadow-sm ring-1 ring-black/5 dark:ring-white/10"
            priority
          />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50 font-sf-pro">
              Uni-Chat
            </span>
          </div>
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2 mt-1 scale-100 origin-center whitespace-nowrap z-50 hidden md:block">
          <MenuBar items={getDesktopMenuItems(pathname || "")} activeHref={pathname || ""} isBottom={false} />
        </div>

        <div className="flex items-center gap-3 ml-auto md:ml-0">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="group flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-zinc-200/80 transition-colors duration-200 hover:bg-zinc-100 dark:bg-zinc-800/90 dark:ring-zinc-700/80 dark:hover:bg-zinc-700/90 shadow-sm cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
          >
            {isDark ? (
              <Moon className="h-5 w-5 text-indigo-300" />
            ) : (
              <Sun className="h-5 w-5 text-amber-500" />
            )}
          </button>

          {/* Log Out button — hidden on mobile, visible on sm+ */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Log out of Uni-Chat"
            className="hidden sm:flex h-10 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-700 shadow-sm cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
          >
            {loggingOut ? "..." : "Log Out"}
          </button>
        </div>
      </header>
    </div>
    
    {!isActiveChat && (
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 md:hidden block"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <MenuBar items={getMobileMenuItems(pathname || "")} activeHref={pathname || ""} isBottom={true} />
      </div>
    )}

    </>
  );
}
