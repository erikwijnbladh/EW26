"use client";

import { useEffect, useRef } from "react";

/** Keep fixed controls inside the visual viewport when a phone keyboard opens. */
export function useDockViewport() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const frame = ref.current;
    if (!viewport || !frame) return;
    let scheduled = 0;
    const update = () => {
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(() => {
        // Pinch zoom is user-controlled magnification; don't counteract its pan.
        const zoomed = viewport.scale !== 1;
        const bottom = zoomed ? 0 : Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
        frame.style.bottom = `${bottom}px`;
        frame.style.setProperty("--dock-viewport-height", zoomed ? "100dvh" : `${viewport.height}px`);
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(scheduled);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return ref;
}
