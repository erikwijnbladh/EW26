"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { elsewhere } from "@/lib/data";
import { easeGlide } from "@/lib/motion";

/**
 * Photographs, dealt out like a hand of cards, and a viewer to open them in.
 *
 * The deck and the viewer are deliberately unaware of each other. An earlier
 * version grew the clicked card into the photograph, which meant the two had to
 * agree, to the pixel, about where a card was — and a card's position is not a
 * stable thing. It moves when you hover it, and it stops being hovered the
 * moment the backdrop covers it, and starts again the moment the backdrop
 * leaves. Every fix for that bought another frame where something jumped.
 *
 * So nothing is shared now. The deck fans, leans and lifts as it likes; the
 * viewer arrives in the middle of the screen on its own terms. There is no
 * geometry to keep in sync, which is why there is no longer anything to get
 * out of sync.
 */

/** How far the fan leans, end to end, in degrees. */
const FAN = 6;

/** How much of a card the next one covers. */
const OVERLAP = 0.4;

/** Card proportions, and the slack above them for leaning corners and lift. */
const CARD_W = 2;
const CARD_H = 3;
const HEADROOM = 0.5;

const step = CARD_W * (1 - OVERLAP);
const SPAN = step * (elsewhere.length - 1) + CARD_W;
const last = elsewhere.length - 1;

/** The resting lean of card `i`, spread around the middle one. */
const leanOf = (i: number) => (i - last / 2) * (FAN / (last / 2));

/** Quick, and with no overshoot — nothing here rocks into place. */
const HOVER = { duration: 0.16, ease: easeGlide };
const IN = { duration: 0.26, ease: easeGlide };
const OUT = { duration: 0.19, ease: easeGlide };

export function Elsewhere() {
  const still = useReducedMotion();

  const [open, setOpen] = useState<number | null>(null);

  /** Whichever was opened last sits above the rest, like a card put back on top. */
  const [lifted, setLifted] = useState<number | null>(null);

  // The portal needs a document, which the server render doesn't have.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const opener = useRef<number | null>(null);

  const show = useCallback((i: number) => {
    opener.current = i;
    setLifted(i);
    setOpen(i);
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    // Back to the card that was opened rather than the top of the document, or
    // closing the viewer loses your place in the page.
    const at = opener.current;
    if (at !== null) requestAnimationFrame(() => cards.current[at]?.focus());
  }, []);

  useEffect(() => {
    if (open === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      // A photo viewer you can't page through with the arrow keys is a photo
      // viewer you have to close and reopen five times.
      const move =
        event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!move) return;

      event.preventDefault();
      show((open + move + elsewhere.length) % elsewhere.length);
    };

    window.addEventListener("keydown", onKey);

    // Hold the page still underneath, handing the scrollbar's width back as
    // padding so hiding the overflow doesn't shift the layout sideways.
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const overflow = body.style.overflow;
    const padding = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      window.removeEventListener("keydown", onKey);
      body.style.overflow = overflow;
      body.style.paddingRight = padding;
    };
  }, [open, close, show]);

  const photo = open === null ? null : elsewhere[open];

  return (
    <section aria-label="Elsewhere">
      <p className="text-xs text-muted/70">Elsewhere</p>

      {/*
        Bled out sideways and padded back in, like the track strip: the cards
        lean and lift past their own box, and without the slack the end card's
        corner and shadow would be sliced off flat against the column edge. 20px
        is also the most that can be given back — it is exactly the page's own
        gutter, and anything wider would push the clip past the viewport edge on
        a phone.
      */}
      <div className="-mx-5 overflow-hidden px-5 pt-4">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${SPAN} / ${CARD_H + HEADROOM}` }}
        >
          {elsewhere.map((item, i) => (
            <motion.button
              key={item.src}
              ref={(node) => {
                cards.current[i] = node;
              }}
              type="button"
              aria-haspopup="dialog"
              aria-label={`View: ${item.caption}`}
              onClick={() => show(i)}
              className="absolute bottom-0 block origin-bottom cursor-zoom-in overflow-hidden rounded-lg bg-line shadow-ring outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              style={{
                left: `${(step * i * 100) / SPAN}%`,
                width: `${(CARD_W * 100) / SPAN}%`,
                aspectRatio: `${CARD_W} / ${CARD_H}`,
                zIndex: lifted === i ? elsewhere.length : i,
              }}
              initial={false}
              animate={{ rotate: still ? 0 : leanOf(i), y: 0 }}
              // The lift is free again. Nothing measures these cards any more,
              // so it can move as much as it likes without anything having to
              // land on it afterwards.
              whileHover={still ? undefined : { y: "-6%", rotate: leanOf(i) * 0.3 }}
              whileTap={still ? undefined : { scale: 0.97 }}
              transition={still ? { duration: 0 } : HOVER}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                // Cards top out around 130px. Asking for more is asking the
                // browser to download detail it will throw away — the file is
                // 1000 wide for the viewer, not for the deck.
                sizes="(max-width: 640px) 33vw, 160px"
                placeholder="blur"
                blurDataURL={item.blur}
                className="object-cover"
              />
            </motion.button>
          ))}
        </div>
      </div>

      {ready &&
        createPortal(
          <AnimatePresence>
            {photo && (
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={photo.caption}
                // Above the dock, which is the only other fixed thing on the
                // page. Portalled to the body because the deck is clipped.
                // Deliberately animates nothing itself. Fading this layer costs
                // a full-viewport composite on every frame — measured, it took
                // the open from 60fps to 54 with 33ms frames, on top of the
                // children already fading underneath it. AnimatePresence still
                // waits for the exits below, so it only has to be a motion
                // component, not an animated one.
                className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 p-6"
              >
                {/*
                  No `backdrop-blur`. Blurring the whole viewport every frame
                  while a photo animates above it ran this at 15fps with 400ms
                  frames; without it the same open holds 60 with nothing over
                  17ms, and a scrim this opaque was doing the visible work
                  anyway.
                */}
                <motion.button
                  type="button"
                  aria-label="Close"
                  onClick={close}
                  className="absolute inset-0 cursor-zoom-out bg-background/92"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: still ? { duration: 0 } : OUT }}
                  transition={still ? { duration: 0 } : IN}
                />

                {/*
                  Arrives on its own, from slightly small and slightly low. Not
                  from the card: a photo that grows out of the deck has to agree
                  with the deck about where the card is, and the card moves.
                */}
                <motion.div
                  className="relative z-10 overflow-hidden rounded-xl shadow-ring"
                  initial={still ? false : { opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={
                    still
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.97, y: 6, transition: OUT }
                  }
                  transition={still ? { duration: 0 } : IN}
                >
                  <Image
                    key={photo.src}
                    src={photo.src}
                    alt={photo.alt}
                    width={1000}
                    height={1500}
                    sizes="(max-width: 640px) 92vw, 34rem"
                    placeholder="blur"
                    blurDataURL={photo.blur}
                    // Sized by whichever runs out first, the viewport's height
                    // or its width, so a tall photo on a short laptop is whole
                    // rather than cropped to fit.
                    className="block h-auto max-h-[76vh] w-auto max-w-[92vw] object-contain"
                    priority
                  />
                </motion.div>

                {/*
                  Keyed on the index so paging with the arrows swaps the words
                  rather than leaving the previous caption under a new picture.
                */}
                <div className="relative z-10 h-4">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={open}
                      className="max-w-md text-center text-xs text-muted"
                      initial={still ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={still ? { opacity: 0 } : { opacity: 0, y: -3 }}
                      transition={still ? { duration: 0 } : OUT}
                    >
                      {photo.caption}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
}
