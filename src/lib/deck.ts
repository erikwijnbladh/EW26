import type { CSSProperties } from "react";

/**
 * The geometry of the collapsed track deck.
 *
 * Lives here rather than in `latest-playing.tsx` because two components need
 * it and only one of them is a client component. Exports of a `"use client"`
 * module become client references, so a server component can read a number out
 * of one but cannot call a function on it — which is what broke the first
 * attempt at sharing this. A plain module has no such side.
 *
 * The other reason is drift. `PlayingSkeleton` has to reserve exactly the
 * height the deck will occupy, and anything it re-derived by hand would come
 * apart the moment one of these moved — visible as the page jumping when the
 * real strip streams in, which is the exact thing streaming it was meant to
 * stop.
 *
 * `TUCK` is the only one that changes the layout arithmetic: each card is
 * pulled up under the one above it by that much, so the fold sits
 * `TUCK * (preview - 1)` higher than where the document put it.
 */
export const GAP = 8;
export const PAD = 12;
/**
 * How far each card is pulled up under the one above it.
 *
 * The cards are 43px on a 51px pitch, so this leaves a ~9px band of every card
 * behind the front one showing: an edge, a hairline and a sliver of surface. The
 * contents of those cards are faded out entirely (see `stackedContent`), so this
 * is free to be tight — what stacks is the card surfaces, not five overlapping
 * rows of half-clipped text, which is what made the old deck read as a fault.
 */
export const TUCK = 42;
/** How much of the first hidden card is left showing under the stack. */
export const PEEK = 14;
/** The soft bottom edge, so the peeking sliver ends rather than gets cut. */
export const FADE = 26;

/**
 * The deepest visible card's blur, dimming and inset, collapsed.
 *
 * Blur is deliberately small. A card that is one step behind another is not out
 * of focus — it is just further away, and the cue for that is size and edge, not
 * softness. At the 3.6px this used to be, the second card read as a rendering
 * fault rather than as depth: full width, full height, and smeared.
 */
const BLUR = 1.1;
const DIM = 0.3;

/**
 * How far the deepest card pulls in from the front card's edges.
 *
 * This is the cue that actually does the work. A stack of cards seen from the
 * front narrows as it recedes, so each card shows a sliver of the one in front
 * of it down both sides. Scaling alone can't produce that — it shrinks the card
 * about its own centre, which pulls the bottom edge up as much as the sides in,
 * and the tuck then has to fight it. An explicit inset keeps the vertical rhythm
 * to `TUCK` alone and leaves the horizontal taper as its own, readable thing.
 */
const INSET = 9;

/**
 * The width the taper is computed against.
 *
 * `scaleX` is a ratio and the inset is in pixels, so turning one into the other
 * needs a width. Measuring it would mean the geometry couldn't be resolved until
 * after layout — which the skeleton, a server component, has no way to wait for.
 * The column is a fixed `max-w` on every breakpoint that matters, so a constant
 * is honest here; at narrower widths the taper reads a hair wider, which is the
 * right direction anyway.
 */
const CARD_WIDTH = 408;

/** Card depth, 0 at the top of the stack and 1 at the fold and beyond. */
function depth(i: number, preview: number) {
  return preview > 1 ? Math.min(i, preview - 1) / (preview - 1) : 0;
}

/**
 * Where card `i` sits when the stack is closed.
 *
 * Everything here is transform and filter — nothing that costs a layout — so
 * the whole stack can unfold on the compositor while the drawer's height is the
 * one thing the document has to re-flow.
 *
 * The taper is linear in depth. Perspective would argue for something that falls
 * off, but across four cards and 9px the difference is invisible, and linear is
 * the version whose spacing you can actually read off the screen.
 */
export function stacked(i: number, preview: number) {
  const d = depth(i, preview);

  return {
    y: -TUCK * Math.min(i, preview - 1),
    scaleX: 1 - (INSET * 2 * d) / CARD_WIDTH,
    filter: `blur(${(BLUR * d).toFixed(2)}px)`,
    // The card just past the fold is the sliver peeking out from under the
    // stack — the reason the list reads as continuing rather than stopping.
    opacity: i < preview ? 1 - DIM * d : i === preview ? 0.28 : 0,
  };
}

/**
 * The card's *contents*, faded separately from the card itself.
 *
 * The tuck leaves a band of each card behind the front one showing, and that
 * band contains the top of a title and an artist. Left at full strength you get
 * five overlapping rows of half-clipped text, which is the single thing that
 * made the old deck read as broken rather than deep. Fading the contents to
 * nothing one step back leaves the card *surfaces* stacking — an edge, a
 * hairline, a shadow — which is what a stack of cards actually looks like from
 * the front.
 *
 * Separate from `stacked` because it rides a different element: the card owns
 * the transform, the row owns the text.
 */
export function stackedContent(i: number) {
  return { opacity: i === 0 ? 1 : 0 };
}

/** Open: every row's contents fully legible. */
export const FLAT_CONTENT = { opacity: 1 };

/** Open: no stack, no blur, every card at its own size and place. */
export const FLAT = { y: 0, scaleX: 1, filter: "blur(0px)", opacity: 1 };

/**
 * `stacked` as plain CSS, for the skeleton — which is a server component and
 * has no motion values to hand these to.
 *
 * Derived rather than restated: `y` and `scale` are motion's shorthands and
 * mean nothing to the style attribute, so they're folded into a transform here
 * and the numbers still come from the one place that decides them.
 */
export function stackedStyle(i: number, preview: number): CSSProperties {
  const { y, scaleX, filter, opacity } = stacked(i, preview);

  return {
    transform: `translateY(${y}px) scaleX(${scaleX})`,
    transformOrigin: "center top",
    filter,
    opacity,
  };
}

/**
 * The mask for the first paint and the no-JS case, before anything is measured.
 * Pixels off the bottom edge rather than percentages, so it lands identically
 * whatever the rows measure — there's no visible correction when the real one
 * takes over.
 */
export const STATIC_MASK = `linear-gradient(to bottom, #000 0px, #000 calc(100% - ${FADE}px), transparent 100%)`;
