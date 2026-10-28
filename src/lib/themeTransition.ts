"use client";

import React from "react";

/**
 * Executes a smooth, GPU-accelerated dark/light theme transition.
 * Uses the native View Transitions API with seamless compositor-level crossfade
 * without blocking the main JS thread or forcing full-DOM style invalidations.
 * Falls back gracefully to CSS transition for non-supporting browsers.
 */
export function toggleThemeMode(
  nextDark: boolean,
  _event?: React.MouseEvent | MouseEvent | null,
  onComplete?: () => void
) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const updateDOMAndStorage = () => {
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    try {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
      document.cookie = `theme=${nextDark ? "dark" : "light"}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore private mode or storage quota errors
    }

    if (onComplete) {
      onComplete();
    }
  };

  // If View Transitions API is available and user hasn't requested reduced motion:
  if (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    !prefersReducedMotion
  ) {
    try {
      (document as any).startViewTransition(() => {
        updateDOMAndStorage();
      });
    } catch {
      updateDOMAndStorage();
    }
  } else {
    // Fallback: update DOM directly; CSS transitions handle the smooth color fade
    updateDOMAndStorage();
  }
}
