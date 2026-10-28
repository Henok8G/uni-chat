"use client"

import * as React from "react"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { cn } from "@/lib/utils"

import { useRouter } from "next/navigation"

export interface MenuBarItem {
  icon: React.ElementType | ((props: React.SVGProps<SVGSVGElement>) => React.JSX.Element)
  label: string
  href?: string
  onClick?: () => void
}

interface MenuBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  items: MenuBarItem[]
  activeHref?: string
  isBottom?: boolean
}

export function MenuBar({ items, activeHref, className, isBottom = false, ...props }: MenuBarProps) {
  const router = useRouter();
  const defaultIndex = React.useMemo(() => {
    if (!activeHref) return null;
    const exactIdx = items.findIndex((item) => item.href === activeHref);
    if (exactIdx !== -1) return exactIdx;
    const prefixIdx = items.findIndex(
      (item) => item.href && item.href !== "/" && item.href !== "/app" && activeHref.startsWith(item.href + "/")
    );
    return prefixIdx !== -1 ? prefixIdx : null;
  }, [items, activeHref]);

  // Pre-warm client cache for all navigation targets so transitions are instantaneous
  React.useEffect(() => {
    items.forEach((item) => {
      if (item.href && !item.href.startsWith("#")) {
        try {
          router.prefetch(item.href);
        } catch {
          // ignore
        }
      }
    });
  }, [items, router]);

  const [isVisible, setIsVisible] = React.useState(true);
  const { scrollY } = useScroll();

  // Hide the menu on scroll down, show on scroll up
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  });

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ y: isBottom ? 100 : -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: isBottom ? 100 : -100, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn("relative z-50", className)}
          {...props}
        >
          <nav
            aria-label={isBottom ? "Bottom navigation" : "Main navigation"}
            className={cn(
              isBottom
                ? "h-[50px] p-1.5 inline-flex justify-center items-center gap-1 rounded-full bg-[var(--surface-alt)]/90 backdrop-blur-2xl backdrop-saturate-180 border border-[var(--border)]/70 dark:border-white/10 shadow-[0_10px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.65),0_2px_12px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.04] dark:ring-white/[0.06] transition-all duration-200"
                : "h-12 sm:h-12 px-2 sm:px-2 inline-flex justify-center items-center gap-1 sm:gap-1.5 overflow-hidden transition-colors duration-200 rounded-2xl sm:rounded-full bg-[var(--surface-alt)]/85 backdrop-blur-xl backdrop-saturate-150 border border-[var(--border)]/60 shadow-lg shadow-black/5 dark:shadow-black/20"
            )}
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              const isActive = defaultIndex === index;

              return (
                <button
                  key={index}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  onMouseEnter={() => {
                    if (item.href && !item.href.startsWith("#")) {
                      router.prefetch(item.href);
                    }
                  }}
                  onClick={() => {
                    if (item.href?.startsWith("#")) {
                      const el = document.querySelector(item.href);
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    } else if (item.href) {
                      router.push(item.href);
                    } else if (item.onClick) {
                      item.onClick();
                    }
                  }}
                  className={cn(
                    "relative flex justify-center items-center transition-all duration-200 group cursor-pointer select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-900",
                    isBottom
                      ? cn(
                          "h-[38px] rounded-full",
                          isActive
                            ? "text-[var(--background)] px-3.5"
                            : "bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10 w-[38px] px-2"
                        )
                      : cn(
                          "h-10 rounded-xl sm:rounded-full",
                          isActive
                            ? "bg-[var(--foreground)] text-[var(--background)] px-3.5 shadow-xs"
                            : "bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10 w-10 px-2"
                        )
                  )}
                >
                  {isBottom && isActive && (
                    <motion.div
                      layoutId="mobile-bottom-nav-active-pill"
                      className="absolute inset-0 rounded-full bg-[var(--foreground)] shadow-xs pointer-events-none"
                      transition={{
                        type: "spring",
                        stiffness: 460,
                        damping: 34,
                      }}
                    />
                  )}
                  <div className="flex items-center justify-center relative z-10">
                    <Icon className="w-[18px] h-[18px] shrink-0 stroke-[2.2]" />
                    {isActive && (
                      <span className="font-medium text-[13px] whitespace-nowrap tracking-tight ml-1.5 font-sf-pro">
                        {item.label}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

