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

/** Enter: rise, sharpen, fade in. Exit is deliberately quicker than enter. */
export const enter = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
} as const;
