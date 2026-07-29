"use client";

import { useEffect, useState } from "react";
import { NOW_PLAYING_COUNT, type Track } from "@/lib/data";
import type { Playing } from "@/lib/spotify";

/**
 * How often the widget asks what's playing.
 *
 * Matched to the server's own throttle, so a poll that lands on a fresh answer
 * and one that lands on a reused answer cost the same: Spotify is asked at most
 * once per interval regardless of how many tabs are open.
 */
const POLL_MS = 10_000;

/** The same identity the server de-duplicates history on. */
function idOf(track: Track) {
  return `${track.title}::${track.artist}`;
}

/**
 * Hold on to the song that was playing when the next answer has forgotten it.
 *
 * The server builds the list as the current track followed by Spotify's
 * recently-played, and recently-played never contains what is playing right
 * now — a track only lands there once it has been played far enough in, and a
 * song skipped early never lands there at all. So skipping from A to B asked
 * Spotify for a list and got B on top of the history from *before* A: the song
 * you just left didn't move down a place, it disappeared, and B took its slot.
 *
 * Nothing on the server can close that gap. It answers each request from what
 * Spotify says at that moment, and Spotify does not say "A was playing ten
 * seconds ago". The poll is the only thing that sees A playing and then not,
 * so this is where the two answers get stitched together.
 *
 * Only a track that was actually live is worth carrying: anything else was
 * already history, and history missing from a fresh answer has legitimately
 * aged out. Where it goes depends on what replaced it — behind the new song if
 * one is playing, at the top if the player simply stopped, which is where "the
 * latest thing played" belongs.
 *
 * Exported for the carry-over tests.
 */
export function carryOver(prev: Playing, next: Playing): Track[] {
  const was = prev.live ? prev.tracks[0] : undefined;
  if (!was) return next.tracks;

  // Already there — Spotify caught up, or it never lost it. Either way the
  // answer is complete and inserting would list the song twice.
  if (next.tracks.some((track) => idOf(track) === idOf(was))) {
    return next.tracks;
  }

  const at = next.live ? 1 : 0;

  return [
    ...next.tracks.slice(0, at),
    was,
    ...next.tracks.slice(at),
    // Re-trimmed because the insert pushes the list one past what the server
    // already sliced it to, and the oldest entry is the one that gives.
  ].slice(0, NOW_PLAYING_COUNT);
}

/**
 * Keeps the track list current while the page is being looked at.
 *
 * `initial` is what the server streamed, which is now at most `REVALIDATE`
 * seconds old rather than as old as the last prerender — so the first poll is
 * a re-sync, not a correction. It still goes out at hydration rather than after
 * an interval: it's one request, it's throttled server-side alongside every
 * other caller, and it means the interval starts from a known-good answer.
 *
 * Successive answers are stitched rather than swapped — see `carryOver`. Each
 * one is a true snapshot on its own, but Spotify has no memory of the song it
 * was reporting ten seconds ago, and consecutive snapshots are the only place
 * that transition is visible.
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
        // is on screen, since a list a minute old reads better than dropping
        // back to the hand-written fallback under someone's eyes.
        //
        // An answer with no tracks is not that. It's "paused, and there's no
        // history to show instead", and `live` has to be allowed through or
        // the heading keeps claiming something is playing after you stop it.
        // Only the list is held over; the status is always the current one.
        if (!stopped && next) {
          setPlaying((prev) => ({
            tracks: next.tracks.length ? carryOver(prev, next) : prev.tracks,
            live: next.live,
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
