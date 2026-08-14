"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { contactHref, profile } from "@/lib/data";

/**
 * Hands back the streamed answer a word at a time, so each one can be animated
 * in on its own — and picks out the few words that should be more than text.
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

export type Token = {
  /** What to render. For a plain word this includes the whitespace after it. */
  text: string;
  /** Punctuation and spacing that followed an entity, rendered outside the link. */
  tail?: string;
  /** Set when the word is one of the site's own destinations. */
  href?: string;
  /** Whether that destination leaves the site. */
  external?: boolean;
  /** Set on Erik's address, which gets a copy button as well as a link. */
  copy?: string;
};

/**
 * The words worth turning into something clickable.
 *
 * Deliberately a closed list rather than a general URL or email matcher. The
 * model is writing this text, and the one thing worse than an address that
 * isn't clickable is a confidently-linked address that goes somewhere else —
 * so the only email that ever becomes a link is the one the site already
 * publishes, and the only destinations are the ones in `contacts`.
 */
const ENTITY = new RegExp(
  `(${profile.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|\\bLinkedIn\\b|\\bGitHub\\b)`,
  "gi",
);

/**
 * What an entity may absorb after itself: closing punctuation and the spacing
 * that follows. Kept out of the link — a full stop inside an anchor is a full
 * stop that underlines — but kept in the same token, so it can't wrap onto a
 * line of its own.
 */
const TAIL = /^[.,;:!?)\]]*\s*/;

/** Each word keeps its own trailing whitespace, so spacing survives reassembly. */
function pushWords(tokens: Token[], text: string) {
  for (const word of text.match(/\S+\s*/g) ?? []) tokens.push({ text: word });
}

function toEntity(value: string, tail: string): Token {
  if (value.toLowerCase() === profile.email.toLowerCase()) {
    return {
      text: value,
      tail,
      href: `mailto:${profile.email}`,
      copy: profile.email,
    };
  }

  return {
    text: value,
    tail,
    href: contactHref(value.toLowerCase()),
    external: true,
  };
}

export function toTokens(text: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  for (const match of text.matchAll(ENTITY)) {
    const at = match.index;
    pushWords(tokens, text.slice(index, at));

    const value = match[0];
    const after = text.slice(at + value.length);
    const tail = TAIL.exec(after)?.[0] ?? "";

    tokens.push(toEntity(value, tail));
    index = at + value.length + tail.length;
  }

  pushWords(tokens, text.slice(index));

  return tokens;
}

export function useWordReveal(text: string, done: boolean, still = false) {
  const tokens = useMemo(() => toTokens(text), [text]);

  // While the stream is open the last word is usually half-delivered. Holding it
  // back until the next one arrives is what stops a word appearing as "Compi"
  // and mutating into "Compileit" a frame later, taking the line wrap with it.
  // It also gives the entity matcher a whole word to judge.
  const ready = done ? tokens.length : Math.max(0, tokens.length - 1);

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

  return still ? tokens : tokens.slice(0, count);
}
