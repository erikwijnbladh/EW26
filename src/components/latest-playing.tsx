"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { nowPlaying, NOW_PLAYING_PREVIEW } from "@/lib/data";
import { duration, ease, springSnappy, springSurface } from "@/lib/motion";

/**
 * How much a row dims as it goes down the list. Collapsed, the tail fades out
 * to hint there's more; expanded, everything reads at full strength.
 */
const dim = (i: number, expanded: boolean) =>
  expanded ? 1 : Math.max(0.18, 1 - i * 0.19);

/** Three little bars, pulsing. Marks the most recent track. */
function Equalizer() {
  const still = useReducedMotion();

  return (
    <span className="flex h-3 w-3 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-full w-[2px] origin-bottom rounded-full bg-foreground"
          initial={{ scaleY: 0.35 }}
          animate={still ? { scaleY: 0.55 } : { scaleY: [0.3, 1, 0.3] }}
          transition={
            still
              ? { duration: 0 }
              : {
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.16,
                }
          }
        />
      ))}
    </span>
  );
}

function Chevron({ up }: { up: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="size-3.5"
      animate={{ rotate: up ? 180 : 0 }}
      transition={springSnappy}
      aria-hidden
    >
      <path
        d="m7 10 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

/**
 * The last few tracks — a hairline list that dims toward the bottom, with the
 * rest of the ten a click away.
 */
export function LatestPlaying() {
  const [expanded, setExpanded] = useState(false);
  const still = useReducedMotion();

  const tracks = expanded
    ? nowPlaying
    : nowPlaying.slice(0, NOW_PLAYING_PREVIEW);

  return (
    <section aria-label="Latest playing">
      <p className="text-xs uppercase tracking-[0.08em] text-muted/70">
        Latest playing
      </p>

      <motion.ol layout transition={{ layout: springSurface }} className="mt-4">
        <AnimatePresence initial={false} mode="popLayout">
          {tracks.map((track, i) => (
            <motion.li
              key={`${track.artist}-${track.title}`}
              layout
              initial={still ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: dim(i, expanded), y: 0 }}
              exit={
                still
                  ? { opacity: 0 }
                  : { opacity: 0, y: -4, transition: { duration: 0.15, ease } }
              }
              transition={{
                // Rows sliding to a new position spring; opacity just fades.
                layout: springSurface,
                duration: duration.base,
                // Stagger only the rows being revealed, not the ones already there.
                delay:
                  i >= NOW_PLAYING_PREVIEW
                    ? (i - NOW_PLAYING_PREVIEW) * 0.05
                    : 0,
                ease,
              }}
              className="flex items-baseline gap-4 border-t border-line py-2.5 first:border-t-0"
            >
              <span className="flex min-w-0 items-baseline gap-2.5">
                {i === 0 && (
                  <span className="translate-y-[1px]">
                    <Equalizer />
                  </span>
                )}
                <span className="truncate text-[15px] text-foreground">
                  {track.title}
                </span>
              </span>
              <span className="ml-auto shrink-0 text-[15px] font-light text-muted">
                {track.artist}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ol>

      <motion.button
        layout
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        whileTap={still ? undefined : { scale: 0.97 }}
        transition={{ layout: springSurface, scale: springSnappy }}
        className="mt-4 flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-muted/70 transition-colors duration-150 hover:text-foreground"
      >
        {expanded ? "Show less" : `View more (${nowPlaying.length})`}
        <Chevron up={expanded} />
      </motion.button>
    </section>
  );
}
