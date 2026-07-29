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
 * The song drawer.
 *
 * A curve rather than a spring, which is a change of character and not just of
 * numbers. A critically damped spring is the wrong shape for a large clipped
 * surface: measured over this drawer's three hundred pixels it puts half the
 * travel into the first seventh of the time and peaks at four and a half times
 * its own average speed — around fifty pixels in a frame. So the first frame a
 * phone misses moves the drawer, and the whole page below it, a hundred pixels
 * in one step. That is what reads as the movement being chopped up, and it is
 * not something cheaper frames can fix: the curve needs every one of them.
 *
 * This one still leaves the instant it's asked to, because a tap has to be
 * answered — a third of the way there by a fifth of the time. But it peaks
 * under three times its average and spends the rest of its length slowing
 * down, so nothing ever moves fast enough for a missed frame to show as a jump.
 *
 * Not overshooting was the spring's one virtue here and the curve keeps it: the
 * drawer clips its contents, so any bounce would briefly reveal empty space
 * past the last row.
 *
 * Closing is a little quicker than opening — there's less to take in on the way
 * out.
 */
export const drawer = [0.33, 0.1, 0.15, 1] as const;

export const curtainOpen: Transition = { duration: 0.6, ease: drawer };

export const curtainClose: Transition = { duration: 0.52, ease: drawer };

/**
 * A card changing rank in the closed stack — a poll landed a new song on top,
 * so everything below it is now one place deeper and wants a little more tuck,
 * dim and blur.
 *
 * Separate from the curtain because it is a separate event: it happens while
 * the drawer is sitting still, and it has to keep working if one lands in the
 * middle of the drawer opening. Its own spring, composed with the curtain's
 * position rather than competing with it. A spring is right here where it was
 * wrong for the drawer — this is eighteen pixels, not three hundred, and at
 * that distance nothing it does is fast enough to stutter.
 */
export const deckSettle: Transition = {
  type: "spring",
  duration: 0.55,
  bounce: 0,
};

/**
 * A new song arriving at the top of the list, pushing everything down a place.
 *
 * Longer than the drawer and just barely underdamped: the movement is small —
 * one card's worth — and at that distance a critically damped spring reads as a
 * slide rather than something settling into place.
 */
export const trackShift: Transition = {
  type: "spring",
  duration: 0.7,
  bounce: 0.14,
};

/** The card falling off the end. Out of sight, so it only has to not snap. */
export const trackLeave: Transition = { duration: 0.32, ease };

/** Reduced motion: same states, no travel between them. */
export const instant: Transition = { duration: 0 };

/** Enter: rise, sharpen, fade in. Exit is deliberately quicker than enter. */
export const enter = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
} as const;
