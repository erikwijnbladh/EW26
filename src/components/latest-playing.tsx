"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { nowPlaying, NOW_PLAYING_PREVIEW } from "@/lib/data";
import { duration, ease, springSnappy, springSurface } from "@/lib/motion";

/**
 * How much a row dims as it goes down the list. Collapsed, the tail fades out
 * to hint there's more; expanded, everything reads at full strength.
 */
const dim = (i: number, expanded: boolean) =>
  expanded ? 1 : Math.max(0.18, 1 - i * 0.19);

/** Live height of an element, tracked through content and viewport changes. */
function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, height] as const;
}

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
 * The last few tracks, with the rest of the ten behind a toggle.
 *
 * Built as a clipped drawer rather than a list of individually-animated rows.
 * All ten stay mounted; only the wrapper's height animates. That matters at
 * the bottom of a short page: shrinking the document by five rows in one frame
 * makes the browser clamp the scroll position instantly, and any layout
 * projection running at the same time gets measured against a viewport that
 * moved underneath it. Animating one height lets the page shrink over the
 * same ~380ms, so the scroll follows it smoothly instead of snapping.
 */
export function LatestPlaying() {
  const [expanded, setExpanded] = useState(false);
  const still = useReducedMotion();
  const [innerRef, innerHeight] = useMeasuredHeight<HTMLOListElement>();

  return (
    <section aria-label="Latest playing" style={{ overflowAnchor: "none" }}>
      <p className="text-xs uppercase tracking-[0.08em] text-muted/70">
        Latest playing
      </p>

      <motion.div
        className="mt-4 overflow-hidden"
        initial={false}
        animate={{ height: innerHeight ?? "auto" }}
        transition={still ? { duration: 0 } : springSurface}
      >
        <ol ref={innerRef}>
          {nowPlaying.map((track, i) => {
            const hidden = !expanded && i >= NOW_PLAYING_PREVIEW;

            return (
              <motion.li
                key={`${track.artist}-${track.title}`}
                initial={false}
                animate={{ opacity: hidden ? 0 : dim(i, expanded) }}
                transition={{
                  duration: duration.base,
                  ease,
                  // Rows being revealed trail in behind the height.
                  delay:
                    expanded && i >= NOW_PLAYING_PREVIEW
                      ? (i - NOW_PLAYING_PREVIEW) * 0.04
                      : 0,
                }}
                // Collapsed rows are clipped anyway; take them out of the
                // measured height so the drawer closes to the right size.
                className={`flex items-baseline gap-4 border-t border-line py-2.5 first:border-t-0 ${
                  hidden ? "hidden" : ""
                }`}
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
            );
          })}
        </ol>
      </motion.div>

      <motion.button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        whileTap={still ? undefined : { scale: 0.97 }}
        transition={springSnappy}
        className="mt-4 flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-muted/70 transition-colors duration-150 hover:text-foreground"
      >
        {expanded ? "Show less" : `View more (${nowPlaying.length})`}
        <Chevron up={expanded} />
      </motion.button>
    </section>
  );
}
