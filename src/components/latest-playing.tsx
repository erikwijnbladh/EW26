"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { nowPlaying, NOW_PLAYING_PREVIEW } from "@/lib/data";
import { curtainClose, curtainOpen, springSnappy } from "@/lib/motion";

/**
 * How much a row dims as it goes down the list. Collapsed, the tail fades out
 * to hint there's more; expanded, everything reads at full strength.
 */
const dim = (i: number) => Math.max(0.18, 1 - i * 0.19);

/** A row's box, measured relative to the top of the list. */
type Row = { top: number; height: number };
type Metrics = { collapsed: number; full: number; rows: Row[] };

/**
 * The window, in curtain-edge pixels, over which one row brightens. It opens a
 * third of the way down the row and trails the edge by about a row, so a couple
 * of rows just behind the edge are always still coming up. Clamped to the
 * drawer's full height, so the last row can't be left half-lit once the curtain
 * has landed.
 */
function revealRange(row: Row, full: number): [number, number] {
  const start = row.top + row.height * 0.35;
  const end = Math.min(row.top + row.height * 1.6, full);
  return [start, Math.max(end, start + 1)];
}

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

type TrackRowProps = {
  title: string;
  artist: string;
  index: number;
  /** The drawer's progress, 0 closed to 1 open. */
  progress: MotionValue<number>;
  metrics: Metrics | null;
  extra: boolean;
  hidden: boolean;
};

/**
 * One track. Its opacity is a *function of the curtain*, never a sibling
 * animation timed against it — so a row physically cannot finish before or
 * after the edge that reveals it, in either direction.
 */
function TrackRow({
  title,
  artist,
  index,
  progress,
  metrics,
  extra,
  hidden,
}: TrackRowProps) {
  const row = metrics?.rows[index];
  const base = dim(index);

  // Every row comes up out of the dim ramp as the drawer opens.
  const settle = useTransform(progress, [0, 1], [base, 1]);

  // Rows behind the curtain are additionally gated by the edge travelling over
  // them. Gating rather than replacing matters: on its own, a just-revealed row
  // would hit full strength while the rows above it were still mid-ramp, and
  // the list would briefly get *brighter* towards the bottom.
  //
  // Derived from `progress` in one step rather than chained off `edge`. Every
  // motion value in a chain updates in the same pre-render flush, and a value
  // three links deep can be computed before the link above it has caught up —
  // which left the last row resting at 0.9915 instead of 1, one frame stale
  // forever, because nothing changed afterwards to correct it.
  const revealed = useTransform(progress, (p: number) => {
    if (!row || !metrics) return 0;

    const at = metrics.collapsed + (metrics.full - metrics.collapsed) * p;
    const [start, end] = revealRange(row, metrics.full);
    const uncovered = Math.min(1, Math.max(0, (at - start) / (end - start)));

    return (base + (1 - base) * p) * uncovered;
  });

  return (
    <motion.li
      // Before the first measurement there's nothing to derive from, so the
      // hidden rows stay flatly transparent rather than guessing.
      style={{ opacity: extra ? (row ? revealed : 0) : settle }}
      aria-hidden={hidden}
      className="flex items-baseline gap-4 border-t border-line py-2.5 first:border-t-0"
    >
      <span className="flex min-w-0 items-baseline gap-2.5">
        {index === 0 && (
          <span className="-my-1 translate-y-[3px] text-foreground/70">
            <AudioLines />
          </span>
        )}
        <span className="truncate text-[15px] text-foreground">{title}</span>
      </span>
      <span className="ml-auto shrink-0 text-[15px] font-light text-muted">
        {artist}
      </span>
    </motion.li>
  );
}

/**
 * The last few tracks, with the rest of the ten behind a toggle.
 *
 * Every row stays mounted and only the wrapper's height moves, so the document
 * shrinks gradually instead of in one frame — which is what made collapsing at
 * the bottom of a phone screen jump.
 *
 * One spring drives the whole thing. The curtain's height *is* that spring, and
 * every row's opacity is derived from where the edge currently sits relative to
 * that row's own box. Nothing is timed against anything else, so the stagger
 * falls out of the geometry for free and is automatically right in both
 * directions — and because a spring is fast in the middle and slow at the ends,
 * the rows inherit that pacing instead of fighting it.
 */
export function LatestPlaying() {
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
  const edge = useTransform(
    progress,
    [0, 1],
    [metrics?.collapsed ?? 0, metrics?.full ?? 0],
  );

  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el) return;

    const children = Array.from(el.children) as HTMLElement[];
    if (children.length < nowPlaying.length) return;

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

  const rows = mounted ? nowPlaying : nowPlaying.slice(0, NOW_PLAYING_PREVIEW);

  return (
    <section aria-label="Latest playing" style={{ overflowAnchor: "none" }}>
      <p className="text-xs uppercase tracking-[0.08em] text-muted/70">
        Latest playing
      </p>

      <motion.div
        className="mt-4 overflow-hidden"
        style={{ height: metrics ? edge : "auto" }}
      >
        <ol ref={listRef}>
          {rows.map((track, i) => {
            const extra = i >= NOW_PLAYING_PREVIEW;

            return (
              <TrackRow
                key={`${track.artist}-${track.title}`}
                title={track.title}
                artist={track.artist}
                index={i}
                progress={progress}
                metrics={metrics}
                extra={extra}
                hidden={extra && !expanded}
              />
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
