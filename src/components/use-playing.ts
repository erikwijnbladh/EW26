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
 * `initial` is what the server streamed, which is now at most `REVALIDATE`
 * seconds old rather than as old as the last prerender — so the first poll is
 * a re-sync, not a correction. It still goes out at hydration rather than after
 * an interval: it's one request, it's throttled server-side alongside every
 * other caller, and it means the interval starts from a known-good answer.
 *
 * Each answer replaces the last rather than being merged into it. An earlier
 * version stitched consecutive polls together to keep a skipped song in the
 * list, which meant showing a play Spotify had decided didn't happen — the
 * widget disagreeing with its own source. `current` changing with the log
 * untouched is the truth about what a skip is.
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

        // null means Spotify is unconfigured or didn't answer — keep whatever
        // is on screen, since a log a minute old reads better than dropping
        // back to the hand-written fallback under someone's eyes.
        //
        // An answer with an empty log is not that. It's "nothing has finished
        // playing", and `current` is always taken as given or the heading keeps
        // claiming something is playing after you stop it. Only the log is held
        // over, and only while it would otherwise go empty.
        if (!stopped && next) {
          setPlaying((prev) => ({
            current: next.current,
            playing: next.playing,
            history: next.history.length ? next.history : prev.history,
          }));
        }
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
