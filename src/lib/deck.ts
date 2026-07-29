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
export const TUCK = 18;
/** How much of the first hidden card is left showing under the stack. */
export const PEEK = 20;
/** The soft bottom edge, so the peeking sliver ends rather than gets cut. */
export const FADE = 26;

/** The deepest card's blur, dimming and shrink, collapsed. */
const BLUR = 3.6;
const DIM = 0.38;
const SHRINK = 0.03;

/**
 * Where a card sits in the deck: four numbers, not styles.
 *
 * Numbers because the drawer interpolates between a card's collapsed pose and
 * its open one on every frame, and a pose that arrived pre-formatted as
 * `blur(2.31px)` would have to be parsed back apart to do it.
 */
export type Pose = { y: number; scale: number; opacity: number; blur: number };

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
 * Blur ramps faster than linearly (`d ** 1.5`) because the first step away from
 * sharp is the one the eye notices: spread evenly, the second card already
 * looks broken rather than behind. Past the fold the values clamp — those cards
 * are behind the deepest visible one and differ only in not being drawn.
 */
export function pose(i: number, preview: number): Pose {
  const d = depth(i, preview);

  // The card just past the fold is the sliver peeking out from under the
  // stack — the reason the list reads as continuing rather than stopping.
  const opacity = i < preview ? 1 - DIM * d : i === preview ? 0.32 : 0;

  return {
    y: -TUCK * Math.min(i, preview - 1),
    scale: 1 - SHRINK * d,
    opacity,
    // A card nobody can see is still a card the phone blurs: any filter puts
    // it on a raster layer of its own, and that layer is rebuilt on every frame
    // the radius moves. Half the deck is behind the peeking sliver and drawn at
    // zero — blurring those was work with no picture at the end of it.
    blur: opacity === 0 ? 0 : BLUR * d ** 1.5,
  };
}

/** Open: no stack, no blur, every card at its own size and place. */
export const FLAT: Pose = { y: 0, scale: 1, opacity: 1, blur: 0 };

/**
 * A pose as a filter string. `none` rather than `blur(0px)` for the sharp end,
 * because the two look identical and only one of them costs a layer.
 */
export function blurFilter(px: number) {
  return px < 0.02 ? "none" : `blur(${px.toFixed(2)}px)`;
}

/**
 * `pose` as plain CSS, for the skeleton — which is a server component and has
 * no motion values to hand these to.
 *
 * Derived rather than restated: `y` and `scale` are motion's shorthands and
 * mean nothing to the style attribute, so they're folded into a transform here
 * and the numbers still come from the one place that decides them.
 */
export function stackedStyle(i: number, preview: number): CSSProperties {
  const { y, scale, opacity, blur } = pose(i, preview);

  return {
    transform: `translateY(${y}px) scale(${scale})`,
    transformOrigin: "center top",
    filter: blurFilter(blur),
    opacity,
  };
}
