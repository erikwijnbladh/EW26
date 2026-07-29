"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { NOW_PLAYING_PREVIEW, type Track } from "@/lib/data";
import { curtainClose, curtainOpen, springSnappy } from "@/lib/motion";

/** A row's box, measured relative to the top of the list. */
type Row = { top: number; height: number };
type Metrics = { collapsed: number; full: number; rows: Row[] };

/**
 * Where the fade sits, in list pixels: opaque down to `solid`, gone by `clear`.
 *
 * Collapsed, it starts under the first row and is still around a fifth lit at
 * the fold, so the list reads as continuing rather than stopping. Open, both
 * stops are pushed past the end — nothing is hidden, so there is nothing left
 * to hint at.
 */
function fadeStops(m: Metrics) {
  const first = m.rows[0];
  const fold = m.rows[NOW_PLAYING_PREVIEW - 1];

  return {
    solidClosed: first.top + first.height,
    clearClosed: m.collapsed + fold.height * 1.15,
    solidOpen: m.full,
    clearOpen: m.full + fold.height,
  };
}

/**
 * Same ramp in percentages, for the first paint and the no-JS case. The rows
 * are equal height, so this lands within a pixel or two of the measured
 * version and there's no visible correction once measurement arrives.
 */
const STATIC_MASK =
  "linear-gradient(to bottom, #000 0px, #000 20%, transparent 118%)";

/**
 * Audio lines: the inner four bars breathe between two heights on loops of
 * different lengths, so they never sync up. Marks a track that's playing now.
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

/** Nothing playing — the top row is just the most recent thing, not live. */
function PlayOff() {
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
      <path d="m10.215 4.56 9.79 5.71a2 2 0 0 1 .003 3.458l-.393.23" />
      <path d="m16.042 16.042-8.034 4.686A2 2 0 0 1 5 19V5" />
      <path d="m2 2 20 20" />
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
 * The last few tracks, with the rest behind a toggle.
 *
 * Every row stays mounted and only the wrapper's height moves, so the document
 * shrinks gradually instead of in one frame — which is what made collapsing at
 * the bottom of a phone screen jump.
 *
 * One spring drives it, and both the height and the fade are derived from that
 * one value. The fade is a gradient mask rather than per-row opacity: stepping
 * opacity row by row banded the list, because each row was a flat block with a
 * hard edge at its border. A mask ramps continuously through the text, and it
 * covers the reveal too — rows emerge out of the soft edge as the drawer opens
 * instead of needing a fade of their own to be timed against it.
 */
export function LatestPlaying({
  tracks,
  live,
}: {
  tracks: Track[];
  /** Whether the first track is playing right now. */
  live: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const still = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  // Render the preview only until hydrated, so no-JS and the first paint show
  // five rows rather than flashing all ten before we can measure them.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const progress = useMotionValue(0);
  const stops = metrics ? fadeStops(metrics) : null;

  const height = useTransform(
    progress,
    [0, 1],
    [metrics?.collapsed ?? 0, metrics?.full ?? 0],
  );
  const solid = useTransform(
    progress,
    [0, 1],
    [stops?.solidClosed ?? 0, stops?.solidOpen ?? 0],
  );
  const clear = useTransform(
    progress,
    [0, 1],
    [stops?.clearClosed ?? 0, stops?.clearOpen ?? 0],
  );
  const mask = useMotionTemplate`linear-gradient(to bottom, #000 0px, #000 ${solid}px, transparent ${clear}px)`;

  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];
    if (children.length < tracks.length) return;

    const listTop = el.getBoundingClientRect().top;
    const rows = children.map((child) => {
      const rect = child.getBoundingClientRect();
      return { top: rect.top - listTop, height: rect.height };
    });

    const lastPreview = rows[NOW_PLAYING_PREVIEW - 1];
    setMetrics({
      collapsed: lastPreview.top + lastPreview.height,
      full: el.getBoundingClientRect().height,
      rows,
    });
  }, [tracks.length]);

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

  useEffect(() => {
    if (still) {
      progress.set(expanded ? 1 : 0);
      return;
    }

    const controls = animate(
      progress,
      expanded ? 1 : 0,
      expanded ? curtainOpen : curtainClose,
    );

    return () => controls.stop();
  }, [expanded, still, progress]);

  const rows = mounted ? tracks : tracks.slice(0, NOW_PLAYING_PREVIEW);

  // All or nothing in practice — Spotify has art for everything, the
  // hand-written fallback for nothing. Ten empty tiles would just read as a
  // broken grid, so without art the list keeps its plain layout.
  const hasArt = tracks.some((track) => track.image);

  return (
    <section aria-label="Latest playing" style={{ overflowAnchor: "none" }}>
      <p className="text-xs uppercase tracking-[0.08em] text-muted/70">
        {live ? "Playing now" : "Latest playing"}
      </p>

      <motion.div
        className="mt-4 overflow-hidden"
        style={{
          height: metrics ? height : "auto",
          maskImage: metrics ? mask : STATIC_MASK,
          WebkitMaskImage: metrics ? mask : STATIC_MASK,
        }}
      >
        <ol ref={listRef}>
          {rows.map((track, i) => (
            <li
              key={`${track.artist}-${track.title}-${i}`}
              aria-hidden={i >= NOW_PLAYING_PREVIEW && !expanded}
              className={`group flex items-center gap-3 border-t border-line first:border-t-0 ${
                hasArt ? "py-2" : "py-2.5"
              }`}
            >
              {hasArt ? (
                <span className="relative size-8 shrink-0 overflow-hidden rounded-[3px] bg-foreground/[0.06]">
                  {track.image && (
                    <Image
                      src={track.image}
                      alt=""
                      fill
                      sizes="64px"
                      // Grey like the rest of the page, and colour on hover —
                      // ten covers at full saturation would be by far the
                      // loudest thing here.
                      className="object-cover grayscale transition-[filter] duration-300 group-hover:grayscale-0"
                    />
                  )}
                  {i === 0 && (
                    <span className="absolute inset-0 grid place-items-center bg-foreground/45 text-background">
                      {live ? <AudioLines /> : <PlayOff />}
                    </span>
                  )}
                </span>
              ) : (
                i === 0 && (
                  <span
                    className={live ? "text-foreground/70" : "text-muted/60"}
                  >
                    {live ? <AudioLines /> : <PlayOff />}
                  </span>
                )
              )}

              <span className="min-w-0 truncate text-[15px] text-foreground">
                {track.title}
              </span>
              <span className="ml-auto shrink-0 text-[15px] font-light text-muted">
                {track.artist}
              </span>
            </li>
          ))}
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
        {expanded ? "Show less" : `View more (${tracks.length})`}
        <Chevron up={expanded} />
      </motion.button>
    </section>
  );
}
