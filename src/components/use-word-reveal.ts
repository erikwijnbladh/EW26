"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Hands back the streamed answer a word at a time, so each one can be animated
 * in on its own.
 *
 * Revealing character by character is what a terminal does, and at reading size
 * it flickers: every frame changes the last glyph, the line re-wraps mid-word,
 * and a blinking caret sits on top of it. Words are the unit people actually
 * read, and one word resolving out of blur while the previous one settles is a
 * much calmer way to say the same thing.
 *
 * Pace is set by how far behind the reveal is rather than fixed, which is what
 * keeps it honest: a smooth stream comes out at a readable speed, and a stall
 * that dumps a paragraph catches up in a fraction of a second instead of typing
 * out three seconds of backlog while the answer sits there finished.
 */

/** Words per second: at rest, and the ceiling while catching up. */
const MIN_SPEED = 9;
const MAX_SPEED = 140;

/** How long the reveal aims to take to drain whatever it's currently behind. */
const CATCH_UP = 0.35;

/** Each word keeps its own trailing whitespace, so spacing survives reassembly. */
function toWords(text: string) {
  return text.match(/\S+\s*/g) ?? [];
}

export function useWordReveal(text: string, done: boolean, still = false) {
  const words = useMemo(() => toWords(text), [text]);

  // While the stream is open the last word is usually half-delivered. Holding it
  // back until the next one arrives is what stops a word appearing as "Compi"
  // and mutating into "Compileit" a frame later, taking the line wrap with it.
  const ready = done ? words.length : Math.max(0, words.length - 1);

  const [count, setCount] = useState(0);

  // The float behind `count`. Kept across restarts — the effect re-runs on every
  // word boundary, and rounding to a whole word each time would quietly lose the
  // fractional progress and stall the reveal at low speeds.
  const revealed = useRef(0);

  useEffect(() => {
    if (still) return;

    // A shorter target means the text was replaced rather than extended.
    if (revealed.current > ready) revealed.current = ready;
    if (revealed.current >= ready) return;

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      // Capped so a backgrounded tab doesn't return and reveal in one jump.
      const elapsed = Math.min((now - last) / 1000, 0.1);
      last = now;

      const backlog = ready - revealed.current;
      const speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, backlog / CATCH_UP));

      revealed.current = Math.min(ready, revealed.current + speed * elapsed);

      // Whole words only — React bails out when the count hasn't moved, so the
      // in-between frames cost nothing.
      const next = Math.floor(revealed.current);
      setCount((prev) => (prev === next ? prev : next));

      // Only while there's ground to make up — an idle chat shouldn't hold a
      // frame callback open.
      if (revealed.current < ready) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [ready, still]);

  return still ? words : words.slice(0, count);
}
