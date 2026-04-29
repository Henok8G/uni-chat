"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Read persisted preference; default to light
    const stored = localStorage.getItem("theme")
    const prefersDark = stored === "dark"
    setIsDark(prefersDark)
    if (prefersDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex items-center w-[72px] h-9 rounded-full p-1 transition-colors duration-300 cursor-pointer border"
      style={{
        backgroundColor: isDark ? "#1e1e2e" : "#e8e8f0",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
      }}
    >
      {/* Track icons */}
      <span className="absolute left-2 flex items-center justify-center">
        <Sun
          size={14}
          className="transition-opacity duration-200"
          style={{ color: isDark ? "#555" : "#f59e0b", opacity: isDark ? 0.5 : 1 }}
        />
      </span>
      <span className="absolute right-2 flex items-center justify-center">
        <Moon
          size={14}
          className="transition-opacity duration-200"
          style={{ color: isDark ? "#B0C4DE" : "#aaa", opacity: isDark ? 1 : 0.5 }}
        />
      </span>

      {/* Sliding thumb */}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className="absolute w-7 h-7 rounded-full shadow-sm flex items-center justify-center"
        style={{
          left: isDark ? "calc(100% - 32px)" : "4px",
          backgroundColor: isDark ? "#B0C4DE" : "#ffffff",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 30, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Moon size={13} style={{ color: "#e2e8f0" }} />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: 30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -30, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sun size={13} style={{ color: "#f59e0b" }} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </button>
  )
}
