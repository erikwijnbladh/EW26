"use client";

import { useEffect, useState } from "react";
import type { Track } from "@/lib/data";
import type { Playing } from "@/lib/spotify";

/**
 * How often the widget asks what's playing.
 *
 * Matched to the server's own throttle, so a poll that lands on a fresh answer
 * and one that lands on a reused answer cost the same: Spotify is asked at most
 * once per interval regardless of how many tabs are open.
 */
const POLL_MS = 10_000;

/** What the widget renders: the server's answer plus how much to trust it. */
export type Shown = Playing & {
  /**
   * True when `current` is a track Spotify has stopped reporting and we are
   * holding on our own account. The heading uses this to stop making claims
   * about the player it can no longer see.
   */
  held: boolean;
};

const same = (a: Track, b: Track) => a.title === b.title && a.artist === b.artist;

/**
 * Fold a fresh answer into what's on screen.
 *
 * A track that is paused for long enough stops being reported at all: the
 * session goes idle and `currently-playing` gives back a 204, or a 200 whose
 * `item` is null. Taken literally that empties the live slot — and a paused
 * song was never logged as a play, because it never finished, so it isn't in
 * the log to fall back to either. It simply vanished off the page a few
 * minutes after being paused, and whatever finished before it jumped back to
 * the top.
 *
 * So the last track the player reported is held until something replaces it.
 * That is not the widget inventing a play — it never claims the track was
 * logged, and `held` makes the heading drop any assertion about live state. It
 * is the last thing the player was on, which is true, and is what "latest
 * playing" means to somebody reading it.
 *
 * The hold ends the moment there's something better: a new current track, or
 * the log claiming this one, which is what happens if it turns out to have
 * been played far enough in to count.
 *
 * Exported for the hold tests.
 */
export function merge(prev: Shown, next: Playing): Shown {
  // An empty log is held over too — see the caller. Kept here so the hold
  // below is checked against the log actually on screen.
  const history = next.history.length ? next.history : prev.history;

  if (next.current) {
    return { current: next.current, playing: next.playing, history, held: false };
  }

  const was = prev.current;
  const keep = was && !history.some((track) => same(track, was)) ? was : null;

  return { current: keep, playing: false, history, held: keep !== null };
}

/**
 * Keeps the track list current while the page is being looked at.
 *
 * `initial` is what the server streamed, which is now at most `REVALIDATE`
 * seconds old rather than as old as the last prerender — so the first poll is
 * a re-sync, not a correction. It still goes out at hydration rather than after
 * an interval: it's one request, it's throttled server-side alongside every
 * other caller, and it means the interval starts from a known-good answer.
 */
export function usePlaying(initial: Playing): Shown {
  const [playing, setPlaying] = useState<Shown>({ ...initial, held: false });

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
        // back to the hand-written fallback under someone's eyes. An answer
        // that arrived is folded in by `merge`.
        if (!stopped && next) setPlaying((prev) => merge(prev, next));
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
