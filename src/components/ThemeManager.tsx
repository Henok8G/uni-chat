"use client";

import { useEffect } from "react";

/**
 * Injects the user's personal theme accent color as a CSS variable on :root.
 * This is a client-only component so it can use the DOM after hydration.
 * Render it in layout.tsx when a logged-in user has a themeColor set.
 */
export function ThemeManager({ color }: { color: string }) {
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-accent", color);
    return () => {
      // Reset to default sky-blue when the component unmounts (e.g., logout)
      document.documentElement.style.removeProperty("--theme-accent");
    };
  }, [color]);

  return null;
}
