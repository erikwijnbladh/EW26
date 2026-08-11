"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals text at a steady pace instead of in whatever bursts the network
 * happens to deliver.
 *
 * Streamed tokens do not arrive evenly. A sentence comes down as a handful of
 * chunks separated by uneven gaps, and painting each one the instant it lands
 * gives the stutter everyone recognises from a badly-wired chat UI: four words,
 * pause, eleven words, pause. Nothing is wrong with the stream — it just looks
 * broken.
 *
 * So the raw text becomes a target and this walks towards it a character at a
 * time. Speed is set by how far behind it is rather than fixed, which is what
 * keeps it honest: a smooth stream reveals at a readable pace, a stalled one
 * that dumps a paragraph catches up in the same fraction of a second instead of
 * typing out three seconds of backlog while the answer sits there finished.
 */

/** Slowest and fastest reveal, in characters per second. */
const MIN_SPEED = 30;
const MAX_SPEED = 900;

/** How long the reveal aims to take to drain whatever it's currently behind. */
const CATCH_UP = 0.3;

export function useSmoothText(target: string, still = false) {
  const [count, setCount] = useState(0);

  // The float behind `count`. Kept across restarts — the effect re-runs on every
  // token, and rounding to a whole character each time would quietly lose the
  // fractional progress and stall the reveal at low speeds.
  const revealed = useRef(0);

  useEffect(() => {
    // Nothing to animate — the caller is handed the whole string below.
    if (still) return;

    // A shorter target means the text was replaced rather than extended.
    if (revealed.current > target.length) revealed.current = target.length;
    if (revealed.current >= target.length) return;

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      // Capped so a backgrounded tab doesn't return and reveal in one jump.
      const elapsed = Math.min((now - last) / 1000, 0.1);
      last = now;

      const backlog = target.length - revealed.current;
      const speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, backlog / CATCH_UP));

      revealed.current = Math.min(target.length, revealed.current + speed * elapsed);
      setCount(Math.floor(revealed.current));

      // Only while there's ground to make up — an idle chat shouldn't hold a
      // frame callback open.
      if (revealed.current < target.length) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, still]);

  return still ? target : target.slice(0, count);
}
