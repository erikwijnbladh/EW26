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
import { usePlaying } from "@/components/use-playing";

/**
 * Only the numbers the drawer needs, resolved at measure time. Deliberately
 * not the row array: indexing it later is how a list shorter than the preview
 * took the whole page down.
 */
type Metrics = {
  collapsed: number;
  full: number;
  firstHeight: number;
  foldHeight: number;
};

/**
 * Where the fade sits, in list pixels: opaque down to `solid`, gone by `clear`.
 *
 * Collapsed, it starts under the first row and is still around a fifth lit at
 * the fold, so the list reads as continuing rather than stopping. Open, both
 * stops are pushed past the end — nothing is hidden, so there is nothing left
 * to hint at.
 */
function fadeStops(m: Metrics) {
  return {
    solidClosed: m.firstHeight,
    clearClosed: m.collapsed + m.foldHeight * 1.15,
    solidOpen: m.full,
    clearOpen: m.full + m.foldHeight,
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
 * different lengths, so they never sync up. Sits beside the heading to mark
 * that something is playing right now.
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
      className="size-3.5"
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
 *
 * The props are the server's answer, which for a statically rendered page is
 * a snapshot from whenever it was last built. `usePlaying` takes over once
 * there's a client to poll with.
 */
export function LatestPlaying({
  tracks: initialTracks,
  live: initialLive,
}: {
  tracks: Track[];
  /** Whether the first track is playing right now. */
  live: boolean;
}) {
  const { tracks, live } = usePlaying({
    tracks: initialTracks,
    live: initialLive,
  });

  const [expanded, setExpanded] = useState(false);
  const still = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  // Spotify can hand back fewer tracks than the preview wants — a short
  // history, or a run of the same song collapsing under de-duplication. Then
  // there's nothing behind the fold, so there's no drawer, no fade and no
  // toggle: the list is simply the list.
  const preview = Math.min(NOW_PLAYING_PREVIEW, tracks.length);
  const expandable = tracks.length > preview;

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
    const box = (i: number) => {
      const rect = children[i]?.getBoundingClientRect();
      return rect ? { top: rect.top - listTop, height: rect.height } : null;
    };

    const first = box(0);
    const fold = box(preview - 1);
    if (!first || !fold) return;

    setMetrics({
      collapsed: fold.top + fold.height,
      full: el.getBoundingClientRect().height,
      firstHeight: first.height,
      foldHeight: fold.height,
    });
  }, [tracks.length, preview]);

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

  const rows = mounted ? tracks : tracks.slice(0, preview);
  const drawer = expandable && metrics !== null;

  // All or nothing in practice — Spotify has art for everything, the
  // hand-written fallback for nothing. Ten empty tiles would just read as a
  // broken grid, so without art the list keeps its plain layout.
  const hasArt = tracks.some((track) => track.image);

  return (
    <section aria-label="Latest playing" style={{ overflowAnchor: "none" }}>
      {/*
        The live marker sits with the heading rather than on the first row's
        album art. Over the art it needed a scrim to stay legible, which meant
        the one cover with anything happening to it was the one you could see
        least — and it read as a play button, as though the tile were a
        control. Up here it's just a status next to the word that states it.
      */}
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-muted/70">
        {live ? "Playing now" : "Latest playing"}
        {live && <AudioLines />}
      </p>

      <motion.div
        className="mt-4 overflow-hidden"
        style={{
          height: drawer ? height : "auto",
          // Nothing is hidden when the list is short, so a fade would be a lie.
          maskImage: expandable ? (drawer ? mask : STATIC_MASK) : undefined,
          WebkitMaskImage: expandable ? (drawer ? mask : STATIC_MASK) : undefined,
        }}
      >
        <ol ref={listRef}>
          {rows.map((track, i) => (
            <li
              key={`${track.artist}-${track.title}-${i}`}
              aria-hidden={expandable && i >= preview && !expanded}
              className={`group flex items-center gap-3 border-t border-line first:border-t-0 ${
                hasArt ? "py-2" : "py-2.5"
              }`}
            >
              {hasArt && (
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
                </span>
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

      {expandable && (
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
      )}
    </section>
  );
}
