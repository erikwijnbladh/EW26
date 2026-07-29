"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { nowPlaying, NOW_PLAYING_PREVIEW } from "@/lib/data";
import { ease, springSnappy, springSurface } from "@/lib/motion";

/**
 * How much a row dims as it goes down the list. Collapsed, the tail fades out
 * to hint there's more; expanded, everything reads at full strength.
 */
const dim = (i: number, expanded: boolean) =>
  expanded ? 1 : Math.max(0.18, 1 - i * 0.19);

/** Gap between one row's fade and the next. */
const STAGGER = 0.05;

/** Rows always live in the DOM; these are the two heights the curtain moves between. */
type Heights = { collapsed: number; full: number };

/**
 * Audio lines: the inner four bars breathe between two heights on loops of
 * different lengths, so they never sync up. Marks the most recent track.
 */
function AudioLines() {
  const still = useReducedMotion();

  const bar = (rest: string, peak: string, duration: number) => (
    <motion.path
      key={rest}
      d={rest}
      initial={{ d: rest }}
      animate={still ? { d: rest } : { d: [rest, peak, rest] }}
      transition={
        still
          ? { duration: 0 }
          : { duration, repeat: Infinity, ease: "easeInOut" }
      }
    />
  );

  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 10v3" />
      {bar("M6 6v11", "M6 10v3", 1.5)}
      {bar("M10 3v18", "M10 9v5", 1)}
      {bar("M14 8v7", "M14 6v11", 0.8)}
      {bar("M18 5v13", "M18 7v9", 1.5)}
      <path d="M22 10v3" />
    </svg>
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
 * Every row stays mounted and only the wrapper's height moves, so the document
 * shrinks gradually instead of in one frame — which is what made collapsing at
 * the bottom of a phone screen jump.
 *
 * The choreography is deliberately asymmetric. Opening, the curtain goes up
 * first and rows fade in behind it, top down. Closing, the rows fade out from
 * the bottom up and the curtain follows a beat later, so it draws down over
 * rows that are already leaving rather than chopping them off.
 */
export function LatestPlaying() {
  const [expanded, setExpanded] = useState(false);
  const still = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const [heights, setHeights] = useState<Heights | null>(null);

  // Render the preview only until hydrated, so no-JS and the first paint show
  // five rows rather than flashing all ten before we can measure them.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el) return;

    const rows = Array.from(el.children) as HTMLElement[];
    const lastPreview = rows[NOW_PLAYING_PREVIEW - 1];
    if (!lastPreview || rows.length < nowPlaying.length) return;

    const top = el.getBoundingClientRect().top;
    setHeights({
      collapsed: Math.round(lastPreview.getBoundingClientRect().bottom - top),
      full: Math.round(el.getBoundingClientRect().height),
    });
  }, []);

  // Measured before paint, so the collapsed height is in place on the same
  // frame the extra rows mount.
  useLayoutEffect(measure, [mounted, measure]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // Re-measure when the rows rewrap at a new width.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const rows = mounted ? nowPlaying : nowPlaying.slice(0, NOW_PLAYING_PREVIEW);
  const lastIndex = nowPlaying.length - 1;

  /** When a given row starts its fade. */
  function rowDelay(i: number, extra: boolean) {
    if (still) return 0;
    if (expanded) {
      // Behind the rising curtain, top down.
      return extra ? 0.08 + (i - NOW_PLAYING_PREVIEW) * STAGGER : 0;
    }
    // Bottom row first, working back up towards the ones that stay.
    return extra ? (lastIndex - i) * STAGGER : 0.06;
  }

  return (
    <section aria-label="Latest playing" style={{ overflowAnchor: "none" }}>
      <p className="text-xs uppercase tracking-[0.08em] text-muted/70">
        Latest playing
      </p>

      <motion.div
        className="mt-4 overflow-hidden"
        initial={false}
        animate={{
          height: heights
            ? expanded
              ? heights.full
              : heights.collapsed
            : "auto",
        }}
        transition={
          still
            ? { duration: 0 }
            : {
                ...springSurface,
                // Closing, let the last row start leaving before the curtain
                // moves; opening, the curtain leads.
                delay: expanded ? 0 : 0.12,
              }
        }
      >
        <ol ref={listRef}>
          {rows.map((track, i) => {
            const extra = i >= NOW_PLAYING_PREVIEW;
            const gone = extra && !expanded;

            return (
              <motion.li
                key={`${track.artist}-${track.title}`}
                initial={false}
                animate={{ opacity: gone ? 0 : dim(i, expanded) }}
                transition={{
                  duration: still ? 0 : 0.32,
                  ease,
                  delay: rowDelay(i, extra),
                }}
                aria-hidden={gone}
                className="flex items-baseline gap-4 border-t border-line py-2.5 first:border-t-0"
              >
                <span className="flex min-w-0 items-baseline gap-2.5">
                  {i === 0 && (
                    <span className="-my-1 translate-y-[3px] text-foreground/70">
                      <AudioLines />
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
