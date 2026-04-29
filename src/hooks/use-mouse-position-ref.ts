"use client"

import { useEffect, useRef, RefObject } from "react"

export function useMousePositionRef(containerRef: RefObject<HTMLElement | null>) {
  const position = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        position.current = {
          x: e.clientX - rect.left - rect.width / 2,
          y: e.clientY - rect.top - rect.height / 2,
        }
      }
    }

    // Register event listener safely
    window.addEventListener("mousemove", updatePosition)
    
    // Cleanup
    return () => window.removeEventListener("mousemove", updatePosition)
  }, [containerRef])

  return position
}
