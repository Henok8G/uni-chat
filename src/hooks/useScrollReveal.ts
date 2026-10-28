"use client";

import { useCallback, useRef } from "react";

/**
 * useScrollReveal — attaches an IntersectionObserver to a ref that
 * adds/removes the `visible` class (paired with the .reveal CSS class).
 * Returns a callback ref to handle conditionally rendered elements.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const observer = useRef<IntersectionObserver | null>(null);

  // We stringify options for stable dependency, though typically options are static
  const optionsStr = JSON.stringify(options || {});

  const ref = useCallback((node: T | null) => {
    if (observer.current) {
      observer.current.disconnect();
      observer.current = null;
    }
    
    if (node) {
      const parsedOptions = optionsStr ? JSON.parse(optionsStr) : undefined;
      observer.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            node.classList.add("visible");
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px", ...parsedOptions }
      );
      observer.current.observe(node);
    }
  }, [optionsStr]);

  return ref;
}
