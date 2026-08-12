"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { elsewhere } from "@/lib/data";
import { easeGlide } from "@/lib/motion";

/**
 * Photographs, dealt out like a hand of cards. Clicking one opens it in place.
 *
 * Nothing ever leaves the deck. An earlier version grew the clicked card into a
 * viewer over the page, which meant the deck and the viewer had to agree, to
 * the pixel, about where a card was — and a card's position is not a stable
 * thing. It moves when you hover it, and it stops being hovered the moment a
 * backdrop covers it. Every fix for that bought another frame where something
 * jumped.
 *
 * Here the picked card simply grows and the others shrink aside, in the same
 * container, keeping their order. There is no second copy of anything to keep
 * in sync, so there is nothing to come apart — and every card moves on
 * transform alone, which is why it holds 60fps while five things move at once.
 */

/**
 * The card's laid-out width, as a fraction of the deck. Every card is this
 * size and is scaled *down* when it isn't the one being looked at — laying
 * them out small and scaling up would rasterise at the small size and enlarge
 * a blurry bitmap.
 */
const BASE = 0.54;

/** Scale at rest, and when another card is the one open. */
const REST = 0.5;
const ASIDE = 0.24;

/** Gap between card centres at rest, as a fraction of the deck. */
const SPREAD = 0.145;

/**
 * Where the shrunken cards tuck when one is open, and how tightly they pack.
 *
 * `TUCK` is how much of each tucked card stays uncovered by the next one in,
 * and it is the whole reason the open card isn't larger. At a tighter pack the
 * outer cards were 81px wide with 16px showing, which left their middles
 * completely hidden — there was no part of the card you could aim at.
 */
const EDGE = 0.28;
const TUCK = 0.055;

/** How far the fan leans, end to end, in degrees. */
const FAN = 6;

/** The deck's height, as a percentage of its width, closed and open. */
const SHUT_H = "47%";
const OPEN_H = "86%";

const last = elsewhere.length - 1;
const leanOf = (i: number) => (i - last / 2) * (FAN / (last / 2));

/** Quick, and with no overshoot — nothing here rocks into place. */
const MOVE = { duration: 0.42, ease: easeGlide };
const HOVER = { duration: 0.16, ease: easeGlide };

/**
 * Where card `i` sits, given which card is open.
 *
 * `x` is in percentages of the card's own width, which is what Motion's `x`
 * means — hence dividing by BASE to convert from fractions of the deck, and the
 * extra -50% that centres a card on `left: 50%`.
 */
function place(i: number, open: number | null, still: boolean) {
  const at = (fraction: number) => `${(fraction / BASE - 0.5) * 100}%`;

  if (open === null) {
    return {
      x: at((i - last / 2) * SPREAD),
      scale: REST,
      rotate: still ? 0 : leanOf(i),
      z: i,
    };
  }

  if (i === open) return { x: at(0), scale: 1, rotate: 0, z: elsewhere.length };

  // Kept on their own side of the open card, in the order they were dealt.
  const side = i < open ? -1 : 1;
  const rank = Math.abs(i - open);

  return {
    x: at(side * (EDGE + (rank - 1) * TUCK)),
    scale: ASIDE,
    rotate: still ? 0 : side * 4,
    z: elsewhere.length - rank,
  };
}

export function Elsewhere() {
  const still = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (open === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(null);
        cards.current[open]?.focus();
        return;
      }
      const move =
        event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!move) return;

      event.preventDefault();
      const next = (open + move + elsewhere.length) % elsewhere.length;
      setOpen(next);
      cards.current[next]?.focus();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <section aria-label="Elsewhere">
      <p className="text-xs text-muted/70">Elsewhere</p>

      {/*
        Bled out sideways and padded back in, like the track strip: the cards
        lean and tuck past their own box, and without the slack the outermost
        one would be sliced off flat against the column edge. 20px is also the
        most that can be given back — it is exactly the page's own gutter, and
        anything wider would push the clip past the viewport on a phone.
      */}
      <div className="-mx-5 overflow-hidden px-5 pt-4">
        {/*
          Height as a percentage of width, which is what percentage padding
          means — so the deck can grow to fit an opened card without anything
          measuring the viewport. The cards themselves only ever transform.
        */}
        <motion.div
          className="relative w-full"
          initial={false}
          animate={{ paddingTop: open === null ? SHUT_H : OPEN_H }}
          transition={still ? { duration: 0 } : MOVE}
        >
          {elsewhere.map((item, i) => {
            const spot = place(i, open, !!still);
            const shown = open === i;

            return (
              <motion.button
                key={item.src}
                ref={(node) => {
                  cards.current[i] = node;
                }}
                type="button"
                aria-pressed={shown}
                aria-label={shown ? `Close: ${item.caption}` : `Open: ${item.caption}`}
                onClick={() => setOpen(shown ? null : i)}
                className={`absolute bottom-0 left-1/2 block overflow-hidden rounded-xl bg-line shadow-ring outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 ${
                  shown ? "cursor-zoom-out" : "cursor-zoom-in"
                }`}
                style={{
                  width: `${BASE * 100}%`,
                  aspectRatio: "2 / 3",
                  // Cards sit on the floor of the deck and grow upward from it,
                  // so the one being opened doesn't slide down as it scales.
                  transformOrigin: "bottom center",
                  zIndex: spot.z,
                }}
                initial={false}
                animate={{ x: spot.x, scale: spot.scale, rotate: spot.rotate }}
                whileHover={
                  still || open !== null ? undefined : { y: "-4%", rotate: leanOf(i) * 0.3 }
                }
                transition={still ? { duration: 0 } : MOVE}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  // The card is laid out at its opened size and scaled down, so
                  // this is the size to ask for even while it looks small.
                  sizes="(max-width: 640px) 60vw, 300px"
                  placeholder="blur"
                  blurDataURL={item.blur}
                  className="object-cover"
                />

                {/*
                  The cards that aren't open sit back rather than the open one
                  coming forward: lightening four is a smaller change than
                  darkening one, and it keeps the deck from flashing as the
                  selection moves along it.
                */}
                <motion.span
                  aria-hidden
                  className="absolute inset-0 bg-background"
                  initial={false}
                  animate={{ opacity: open === null || shown ? 0 : 0.5 }}
                  transition={still ? { duration: 0 } : MOVE}
                />
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/*
        A fixed slot. The caption crossfades in place rather than the section
        growing a line, so moving along the deck doesn't shunt the page.
      */}
      <div className="relative mt-4 h-4">
        <AnimatePresence mode="wait" initial={false}>
          {open !== null && (
            <motion.p
              key={open}
              className="absolute inset-x-0 top-0 text-xs text-muted"
              initial={still ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={still ? { opacity: 0 } : { opacity: 0, y: -3 }}
              transition={{ duration: still ? 0 : 0.16, ease: easeGlide }}
            >
              {elsewhere[open].caption}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
