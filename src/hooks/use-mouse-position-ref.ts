"use client"

import { useEffect, useRef, RefObject } from "react"

export function useMousePositionRef(containerRef: RefObject<HTMLElement | null>) {
  const position = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let cachedRect: DOMRect | null = null;

    const updateRect = () => {
      if (containerRef.current) {
        cachedRect = containerRef.current.getBoundingClientRect();
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect, { passive: true });
    window.addEventListener("scroll", updateRect, { passive: true });

    const updatePosition = (e: MouseEvent) => {
      if (!cachedRect) updateRect();
      if (cachedRect) {
        position.current = {
          x: e.clientX - cachedRect.left - cachedRect.width / 2,
          y: e.clientY - cachedRect.top - cachedRect.height / 2,
        };
      }
    };

    window.addEventListener("mousemove", updatePosition, { passive: true });

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
      window.removeEventListener("mousemove", updatePosition);
    };
  }, [containerRef]);

  return position;
}
