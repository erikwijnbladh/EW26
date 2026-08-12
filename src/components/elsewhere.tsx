"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { elsewhere } from "@/lib/data";
import { duration, ease, springSnappy, springSurface } from "@/lib/motion";

/**
 * Photographs, dealt out like a hand of cards, and a viewer to open them in.
 *
 * The deck is the same gesture as the hover flares in the prose, given a
 * section of its own: things come out from behind each other rather than
 * sitting in a grid. A grid of five holiday photos is a gallery, and a gallery
 * invites you to judge the photography. A hand is just something being shown
 * to you.
 *
 * Opening one grows the card you clicked rather than fading a panel in over the
 * top, so there is never a question of which photo you are now looking at —
 * same idea as the dock's shell morphing into the chat card.
 */

/** How far the fan leans, end to end, in degrees. */
const FAN = 5;

/**
 * How much of a card the next one covers.
 *
 * 0.4 rather than something tighter because of what an opening card does to its
 * neighbour: it grows in place, and at 0.46 its right edge finished within a
 * pixel of the next card's centre — so the most obvious place to click the card
 * beside it hit the wrong one.
 */
const OVERLAP = 0.4;

/** Card geometry in arbitrary units, laid out as percentages of the section. */
const CARD_W = 2;
const CARD_H = 3;

/** Room above the deck for a card to lift into on hover. */
const HEADROOM = 0.4;

/** How much of the viewport the opened photo may take. */
const VIEW_H = 0.76;
const VIEW_W = 0.92;

const step = CARD_W * (1 - OVERLAP);
const SPAN = step * (elsewhere.length - 1) + CARD_W;
const last = elsewhere.length - 1;

/** The resting lean of card `i`, spread around the middle one. */
const leanOf = (i: number) => (i - last / 2) * (FAN / (last / 2));

type Box = { w: number; h: number; left: number; top: number };

/** Where the opened photo ends up: as large as fits, centred. */
function viewerBox(): Box {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let h = vh * VIEW_H;
  let w = (h * CARD_W) / CARD_H;

  // A tall photo on a narrow phone runs out of width first.
  if (w > vw * VIEW_W) {
    w = vw * VIEW_W;
    h = (w * CARD_H) / CARD_W;
  }

  return { w, h, left: (vw - w) / 2, top: (vh - h) / 2 };
}

/**
 * Where card `i` is, derived rather than measured.
 *
 * `getBoundingClientRect` on a card returns the bounding box of a *rotated*
 * rectangle, which at a 5° lean is some 13% wider than the card — enough that
 * a photo growing from it would start visibly too big and shrink. The deck's
 * container isn't rotated, so the cards' real boxes come off it and the
 * percentages they're laid out with.
 */
function cardBox(deck: HTMLElement | null, i: number): Box | null {
  if (!deck) return null;

  const rect = deck.getBoundingClientRect();
  const w = (rect.width * CARD_W) / SPAN;
  const h = (w * CARD_H) / CARD_W;

  return {
    w,
    h,
    left: rect.left + (rect.width * step * i) / SPAN,
    // The cards sit on the floor of the deck; the headroom is above them.
    top: rect.bottom - h,
  };
}

/** The flight from a card to the opened photo, as a transform. */
function flight(from: Box | null, to: Box | null, i: number) {
  if (!from || !to) return { opacity: 0 };

  return {
    x: from.left + from.w / 2 - (to.left + to.w / 2),
    y: from.top + from.h / 2 - (to.top + to.h / 2),
    scale: from.w / to.w,
    rotate: leanOf(i),
    opacity: 1,
  };
}

export function Elsewhere() {
  const still = useReducedMotion();

  const [open, setOpen] = useState<number | null>(null);
  const [from, setFrom] = useState<Box | null>(null);
  const [to, setTo] = useState<Box | null>(null);

  /**
   * The card drawn above the rest: whichever was opened last.
   *
   * Without it the photo flies home to a card that is *behind* its neighbours,
   * so the handover at the end lands on something half-covered and the card
   * appears to blink into place under the others. Raising it also leaves the
   * deck showing which one you just looked at, which is what a hand of cards
   * does when you put one back on top.
   */
  const [lifted, setLifted] = useState<number | null>(null);

  /**
   * The card the viewer is currently holding, hidden while it holds it.
   *
   * Cleared when the closing flight finishes rather than when the viewer
   * closes, so the card comes back in the same frame the photo lands on it and
   * unmounts. Anything looser shows both at once.
   */
  const [held, setHeld] = useState<number | null>(null);

  // The portal needs a document, which the server render doesn't have.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const deck = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const opener = useRef<number | null>(null);

  const show = useCallback((i: number) => {
    opener.current = i;
    setFrom(cardBox(deck.current, i));
    setTo(viewerBox());
    setLifted(i);
    setHeld(i);
    setOpen(i);
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    // Send the caret back to the card that was clicked rather than the top of
    // the document, or closing the viewer loses your place in the page.
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
      // `show` rather than `setOpen`, so the next photo also becomes the card
      // the viewer will fly back to when it closes.
      show((open + move + elsewhere.length) % elsewhere.length);
    };

    const resize = () => setTo(viewerBox());

    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", resize);

    // Hold the page still underneath. The scrollbar's width is handed back as
    // padding — without it, hiding the overflow shifts the whole layout
    // sideways at the exact moment the photo is flying across it.
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const overflow = body.style.overflow;
    const padding = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", resize);
      body.style.overflow = overflow;
      body.style.paddingRight = padding;
    };
  }, [open, close, show]);

  const photo = open === null ? null : elsewhere[open];
  const move = open === null ? { opacity: 0 } : flight(from, to, open);

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
          ref={deck}
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
                // Not animated, and deliberately not in `animate`: this is a
                // handover rather than a fade. The photo covers the card
                // exactly at both ends of the flight, so switching instantly is
                // invisible, where a transition would show two of them.
                opacity: held === i ? 0 : 1,
              }}
              initial={false}
              animate={{ rotate: still ? 0 : leanOf(i), y: "0%" }}
              whileHover={
                still ? undefined : { y: "-5%", rotate: leanOf(i) * 0.35 }
              }
              whileTap={{ scale: 0.98 }}
              transition={still ? { duration: 0 } : springSnappy}
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
          <AnimatePresence onExitComplete={() => setHeld(null)}>
            {photo && to && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label={photo.caption}
                // Above the dock, which is the only other fixed thing on the
                // page. Portalled to the body because the deck is clipped, and
                // a photo growing out of it would be cut off at the edges.
                className="fixed inset-0 z-[60]"
              >
                <motion.button
                  type="button"
                  aria-label="Close"
                  onClick={close}
                  className="absolute inset-0 cursor-zoom-out bg-background/85 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: still ? 0 : duration.base, ease }}
                />

                {/*
                  Flown by hand rather than with `layoutId`. Motion's layout
                  projection can't invert a rotated ancestor, and every card in
                  the fan is rotated — so the shared-layout version simply
                  snapped to full size with nothing in between. The card's box
                  is known from the deck's own geometry, which makes the start
                  of the flight exact.
                */}
                <motion.div
                  className="absolute z-10 overflow-hidden rounded-xl shadow-ring"
                  style={{ width: to.w, height: to.h, left: to.left, top: to.top }}
                  initial={still ? { opacity: 0 } : move}
                  animate={
                    still
                      ? { opacity: 1 }
                      : { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }
                  }
                  exit={still ? { opacity: 0 } : move}
                  transition={still ? { duration: 0 } : springSurface}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 640px) 92vw, 34rem"
                    placeholder="blur"
                    blurDataURL={photo.blur}
                    className="object-cover"
                    priority
                  />
                </motion.div>

                {/*
                  Keyed on the index so paging with the arrows swaps the words
                  rather than leaving the previous caption under a new picture.
                */}
                <motion.div
                  className="absolute inset-x-0 z-10 flex justify-center px-6"
                  style={{ top: to.top + to.h + 20 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: still ? 0 : duration.fast, ease }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={open}
                      className="max-w-md text-center text-xs text-muted"
                      initial={still ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={still ? { opacity: 0 } : { opacity: 0, y: -3 }}
                      transition={{ duration: still ? 0 : duration.fast, ease }}
                    >
                      {photo.caption}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
}
