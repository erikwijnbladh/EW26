"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Forces an instant scroll to the top of the page on every route change,
 * so navigations (including back/forward) consistently land at the top of
 * the new content instead of restoring the previous scroll position.
 */
export function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
