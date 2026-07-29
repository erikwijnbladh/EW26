"use client";

import { useEffect, useState } from "react";
import type { Playing } from "@/lib/spotify";

/**
 * How often the widget asks what's playing.
 *
 * Matched to the server's own throttle, so a poll that lands on a fresh answer
 * and one that lands on a reused answer cost the same: Spotify is asked at most
 * once per interval regardless of how many tabs are open.
 */
const POLL_MS = 10_000;

/**
 * Keeps the track list current while the page is being looked at.
 *
 * `initial` is what the server rendered, which for a static page can be
 * arbitrarily old — so the first poll goes out at hydration rather than after
 * an interval, and corrects it straight away.
 */
export function usePlaying(initial: Playing): Playing {
  const [playing, setPlaying] = useState(initial);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    async function tick() {
      controller?.abort();
      controller = new AbortController();

      try {
        const res = await fetch("/api/playing", {
          signal: controller.signal,
          cache: "no-store",
        });

        const next = res.ok ? ((await res.json()) as Playing | null) : null;

        // null means Spotify is unconfigured or not answering. Keep whatever is
        // on screen: a list that's a minute old reads better than dropping back
        // to the hand-written fallback under someone's eyes.
        if (!stopped && next?.tracks.length) setPlaying(next);
      } catch {
        // Offline, aborted, or a payload that didn't parse. Try again next tick
        // — this widget is never allowed to be the thing that breaks.
      }

      if (!stopped) queue();
    }

    function queue() {
      clearTimeout(timer);
      // A backgrounded tab isn't showing anyone anything, and `visibilitychange`
      // starts it up again — so nothing polls while hidden.
      if (document.visibilityState === "visible") {
        timer = setTimeout(tick, POLL_MS);
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void tick();
      else clearTimeout(timer);
    }

    void tick();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return playing;
}
