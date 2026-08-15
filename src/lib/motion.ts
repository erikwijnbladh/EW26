import type { Transition } from "motion/react";

/**
 * Shared motion tokens. Everything on the site pulls its easing and timing
 * from here so transitions feel like one system rather than a pile of
 * one-offs.
 */

/** Expo-out. Fast start, long soft landing — the default for entrances. */
export const ease = [0.16, 1, 0.3, 1] as const;

/** Quint-in-out, for things that move both ways. */
export const easeInOut = [0.65, 0, 0.35, 1] as const;

/**
 * The one for things that travel: a photo growing out of the deck, a card
 * lifting under the cursor.
 *
 * `ease` above is expo-out, which spends most of its time almost stopped. That
 * reads beautifully on something appearing in place and floaty on something
 * crossing the screen. This leaves quickly, covers the distance, and arrives
 * without the long hover at the end — and unlike the springs it has no
 * overshoot at all, so nothing rocks back into position.
 */
export const easeGlide = [0.32, 0.72, 0, 1] as const;

export const duration = {
  /** Hovers, colour changes. */
  fast: 0.15,
  /** Entrances, layout moves. */
  base: 0.4,
  /** Big first-paint reveals. */
  slow: 0.6,
} as const;

/** Interactive press/hover — snappy, no overshoot worth noticing. */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.7,
};

/** Elements arriving on screen — a little softer, a hint of overshoot. */
export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

/**
 * Big surfaces changing size (the dock expanding into the card). Critically
 * damped and deliberately unhurried — ~380ms end to end. Anything snappier at
 * this size reads as a jump rather than a movement.
 */
export const springSurface: Transition = {
  type: "spring",
  stiffness: 240,
  damping: 30,
  mass: 1,
};

/**
 * Duration-and-bounce springs for the expanding shell, borrowed from the
 * expandable-tabs pattern: the shell resizes, the active tab widens to fit its
 * label, and the label itself opens slower than it closes.
 */
export const springShell: Transition = {
  type: "spring",
  duration: 0.58,
  bounce: 0.06,
};

export const springTab: Transition = {
  type: "spring",
  duration: 0.46,
  bounce: 0.04,
};

export const springPanel: Transition = {
  type: "spring",
  duration: 0.46,
  bounce: 0.08,
};

export const labelOpen: Transition = {
  type: "spring",
  duration: 0.38,
  bounce: 0.03,
};

export const labelClose: Transition = { duration: 0.16, ease };

/**
 * A word of a streamed answer resolving out of blur.
 *
 * Long, and expo-out, because the settle is the whole point — several of these
 * overlap at any moment, and anything quicker turns a sentence arriving into a
 * flicker. Opacity runs shorter than the blur so a word is readable slightly
 * before it is sharp, which is what stops the line looking smeared while it
 * fills; same trick as the dock's icons drawing themselves on.
 */
export const wordIn: Transition = {
  duration: 0.55,
  ease,
  opacity: { duration: 0.36, ease },
};

/**
 * Drawing a stroke on, and retracting it off.
 *
 * The pair behind every icon on the site that changes meaning without swapping
 * glyphs — the dock's envelope becoming a tick, the chat's bin becoming a
 * shredder. Opacity snaps in early on the way on so the line reads as being
 * drawn rather than fading up, and is held almost to the end on the way off so
 * the stroke shortens away instead of the icon popping.
 */
export const drawOn = (delay = 0): Transition => ({
  duration: 0.4,
  ease,
  delay,
  opacity: { duration: 0.1, delay },
});

export const drawOff = (delay = 0): Transition => ({
  duration: 0.26,
  ease: easeInOut,
  delay,
  opacity: { duration: 0.1, delay: delay + 0.18 },
});

/** Reduced motion: same states, no travel between them. */
export const instant: Transition = { duration: 0 };

/** Enter: rise, sharpen, fade in. Exit is deliberately quicker than enter. */
export const enter = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
} as const;
