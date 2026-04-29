"use client"

import * as React from "react"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { cn } from "@/lib/utils"

export interface MenuBarItem {
  icon: React.ElementType | ((props: React.SVGProps<SVGSVGElement>) => React.JSX.Element)
  label: string
  href?: string
  onClick?: () => void
}

interface MenuBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  items: MenuBarItem[]
}

const springConfig = {
  duration: 0.3,
  ease: "easeInOut"
}

export function MenuBar({ items, className, ...props }: MenuBarProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
  const [isVisible, setIsVisible] = React.useState(true)
  const { scrollY } = useScroll()

  // Hide the menu on scroll down, show on scroll up
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    if (latest > previous && latest > 150) {
      setIsVisible(false)
    } else {
      setIsVisible(true)
    }
  })

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn("relative z-50", className)}
          {...props}
        >
          <div
            className={cn(
              "h-14 px-2 inline-flex justify-center items-center gap-[6px] overflow-hidden transition-colors",
              "rounded-full bg-[var(--surface-alt)]/90 backdrop-blur-md",
              "border border-[var(--border)] shadow-xl"
            )}
          >
            {items.map((item, index) => {
              const Icon = item.icon
              const isActive = activeIndex === index
              
              return (
                <motion.button
                  key={index}
                  layout
                  onClick={() => {
                    if (item.href?.startsWith('#')) {
                      const el = document.querySelector(item.href);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    } else if (item.href) {
                      window.location.href = item.href;
                    } else if (item.onClick) {
                      item.onClick();
                    }
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex((prev) => (prev === index ? null : prev))}
                  className={cn(
                    "relative h-10 rounded-full flex justify-center items-center overflow-hidden transition-colors duration-200 group",
                    isActive ? "bg-[var(--foreground)] text-[var(--background)] px-4" : "bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] w-10 px-3"
                  )}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                >
                  <motion.div layout className="flex items-center justify-center relative">
                    <Icon className="w-5 h-5 shrink-0" />
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          layout
                          initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                          animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
                          exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="font-semibold text-sm whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
