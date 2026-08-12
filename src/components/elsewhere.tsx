"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { elsewhere } from "@/lib/data";
import { duration, ease, springSnappy, springSoft } from "@/lib/motion";

/**
 * Photographs, dealt out like a hand of cards.
 *
 * The same gesture as the hover flares in the prose, given a whole section:
 * things come out from behind each other rather than sitting in a grid. A grid
 * of five holiday photos is a gallery, and a gallery invites you to judge the
 * photography. A hand is just something being shown to you.
 *
 * Only one caption is ever on screen. Five at once is a table of contents, and
 * it would mean the section changing height as you moved along the deck — so
 * the caption gets one fixed slot underneath and the cards take turns in it.
 */

/** How far the fan leans, end to end, in degrees. */
const FAN = 5;

/**
 * How much of a card the next one covers.
 *
 * 0.4 rather than 0.46 because of what the picked card does to its neighbour:
 * it scales up in place, and at the tighter spacing its right edge finished
 * within a pixel of the next card's centre — so the most obvious place to click
 * the card beside the open one hit the open one instead.
 */
const OVERLAP = 0.4;

/**
 * Card geometry in arbitrary units, laid out as percentages of the section.
 *
 * Not rem: five fixed-width cards that fit the 452px column overflow the 330px
 * one on a phone, and the deck is clipped so it would have been cut off rather
 * than wrapped. In percentages the whole hand scales with whatever column it
 * finds itself in.
 */
const CARD_W = 2;
const CARD_H = 3;

/** Room above the deck for the picked card to rise into. */
const HEADROOM = 0.4;

const step = CARD_W * (1 - OVERLAP);
const SPAN = step * (elsewhere.length - 1) + CARD_W;

export function Elsewhere() {
  const still = useReducedMotion();
  const [picked, setPicked] = useState<number | null>(null);

  const last = elsewhere.length - 1;

  return (
    <section aria-label="Elsewhere">
      <p className="text-xs text-muted/70">Elsewhere</p>

      {/*
        Bled out sideways and padded back in, like the track strip: the cards
        lift and rotate past their own box, and without the slack the end card's
        shadow would be sliced off flat against the column edge.

        20px, not 12: the cards turn about their bottom edge, so a 5° lean
        swings the far corner out by height × sin 5° — around 18px at this size,
        which was clipping the corner off both end cards. 20 is also the most
        that can be given back, since it is exactly the page's own gutter and
        anything wider would push the clip past the viewport on a phone.
      */}
      <div className="-mx-5 overflow-hidden px-5 pt-4">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${SPAN} / ${CARD_H + HEADROOM}` }}
        >
          {elsewhere.map((photo, i) => {
            const open = picked === i;

            // Spread around the middle card so the deck sits level rather than
            // tipping one way.
            const lean = still ? 0 : (i - last / 2) * (FAN / (last / 2));

            return (
              <motion.button
                key={photo.src}
                type="button"
                aria-pressed={open}
                onClick={() => setPicked(open ? null : i)}
                className="absolute bottom-0 block origin-bottom cursor-pointer overflow-hidden rounded-lg bg-line shadow-ring outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
                style={{
                  left: `${(step * i * 100) / SPAN}%`,
                  width: `${(CARD_W * 100) / SPAN}%`,
                  aspectRatio: `${CARD_W} / ${CARD_H}`,
                  // The picked card has to clear the ones dealt after it.
                  zIndex: open ? 20 : i,
                }}
                initial={false}
                animate={{
                  rotate: open ? 0 : lean,
                  y: open ? "-9%" : "0%",
                  scale: open ? 1.07 : 1,
                }}
                whileHover={
                  still || open ? undefined : { y: "-5%", rotate: lean * 0.35 }
                }
                whileTap={{ scale: open ? 1.03 : 0.98 }}
                transition={still ? { duration: 0 } : springSnappy}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  // Cards top out around 140px. Asking for more than twice that
                  // is asking the browser to download detail it will throw
                  // away — the files are 800 wide for the crop, not the display.
                  sizes="(max-width: 640px) 33vw, 160px"
                  placeholder="blur"
                  blurDataURL={photo.blur}
                  className="object-cover"
                />

                {/*
                  The unpicked cards sit back rather than the picked one coming
                  forward. Lightening four is a smaller change than darkening
                  one, and it stops the whole deck flashing as the selection
                  moves along it.
                */}
                <motion.span
                  aria-hidden
                  className="absolute inset-0 bg-background"
                  initial={false}
                  animate={{ opacity: picked === null || open ? 0 : 0.5 }}
                  transition={{ duration: duration.fast, ease }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/*
        A fixed slot. The caption crossfades in place rather than the section
        growing a line, so picking along the deck doesn't shunt the page up and
        down under the cursor.
      */}
      <div className="relative mt-4 h-4">
        <AnimatePresence mode="wait" initial={false}>
          {picked !== null && (
            <motion.p
              key={picked}
              className="absolute inset-x-0 top-0 text-xs text-muted"
              initial={still ? false : { opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                still ? { opacity: 0 } : { opacity: 0, y: -3, filter: "blur(3px)" }
              }
              transition={still ? { duration: 0 } : springSoft}
            >
              {elsewhere[picked].caption}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
