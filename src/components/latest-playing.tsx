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
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  NOW_PLAYING_COUNT,
  NOW_PLAYING_PREVIEW,
  type Track,
} from "@/lib/data";
import {
  FADE,
  FLAT,
  GAP,
  PAD,
  PEEK,
  STATIC_MASK,
  TUCK,
  stacked,
} from "@/lib/deck";
import {
  curtainClose,
  curtainOpen,
  instant,
  springSnappy,
  trackLeave,
  trackShift,
} from "@/lib/motion";
import type { Playing } from "@/lib/spotify";
import { usePlaying } from "@/components/use-playing";

/**
 * Only the two numbers the drawer needs, resolved at measure time. Deliberately
 * not the card array: indexing it later is how a list shorter than the preview
 * took the whole page down.
 */
type Metrics = { collapsed: number; full: number };

/** Further down than the section can get, for a mask that must hide nothing. */
const OPAQUE = 100_000;

/**
 * Stable per-card keys, so a poll that prepends a song moves the existing cards
 * rather than re-mounting all of them one place down.
 *
 * The server de-duplicates by title and artist, so the pair is already an
 * identity. Repeats still get a suffix: a hand-written fallback or a change
 * upstream must not be able to collide two cards onto one key.
 */
function keysFor(tracks: Track[]) {
  const seen = new Map<string, number>();

  return tracks.map((track) => {
    const base = `${track.title}::${track.artist}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n ? `${base}::${n}` : base;
  });
}

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

/** Not advancing — the player is paused, or there's nothing loaded at all. */
function PlayOff() {
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
      <path d="m10.215 4.56 9.79 5.71a2 2 0 0 1 .003 3.458l-.393.23" />
      <path d="m16.042 16.042-8.034 4.686A2 2 0 0 1 5 19V5" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

/**
 * The inside of a card. Split out of the deck's markup so the shape of a row
 * is stated once, whatever ends up wrapping it.
 */
function CardBody({ track, hasArt }: { track: Track; hasArt: boolean }) {
  return (
    <>
      {hasArt && (
        <span className="relative size-8 shrink-0 overflow-hidden rounded-[3px] bg-foreground/[0.06]">
          {track.image && (
            <Image
              src={track.image}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
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
    </>
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
 * The last few tracks as a stack of cards, with the rest behind a toggle.
 *
 * Closed, the cards tuck under each other and go progressively blurred, dimmer
 * and slightly smaller, so the list reads as a deck seen from the front rather
 * than a table that stops. Open, every card is sharp, level and full size —
 * blur is how depth is drawn, so there is none left once nothing is behind
 * anything.
 *
 * Every card stays mounted and only the wrapper's height moves, so the document
 * shrinks gradually instead of in one frame — which is what made collapsing at
 * the bottom of a phone screen jump. Height, tuck, blur, dim and scale all run
 * off the same spring pair, so it's one movement and not five.
 *
 * The live track heads the same deck rather than sitting in a slot of its own.
 * `Playing` keeps it apart from the log because they are different facts — one
 * is the player's state, the other is what Spotify has logged as played — but
 * that is a distinction about where the data comes from, not one the deck has
 * to draw. They stack.
 *
 * The props are the server's answer, streamed in at request time. `usePlaying`
 * takes over once there's a client to poll with, and a new song lands on top:
 * the card fades in out of a blur while the rest slide down a place under it
 * and the last one drops off the bottom.
 */
export function LatestPlaying({
  current: initialCurrent,
  playing: initialPlaying,
  history: initialHistory,
}: Playing) {
  const { current, playing, held, history } = usePlaying({
    current: initialCurrent,
    playing: initialPlaying,
    history: initialHistory,
  });

  const [expanded, setExpanded] = useState(false);
  const still = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  // One deck: whatever the player is on, then the log behind it. Re-trimmed
  // because `current` and `history` are counted separately by the server, so
  // together they run one past what the list shows.
  const tracks = (current ? [current, ...history] : history).slice(
    0,
    NOW_PLAYING_COUNT,
  );

  // Spotify can hand back fewer plays than the preview wants — a short log, or
  // a run of the same song collapsing under de-duplication. Then there's
  // nothing behind the fold, so there's no drawer, no stack and no toggle: the
  // list is simply the list, flat and sharp.
  const preview = Math.min(NOW_PLAYING_PREVIEW, tracks.length);
  const expandable = tracks.length > preview;

  // Render the preview only until hydrated, so no-JS and the first paint show
  // five cards rather than flashing all ten before we can measure them.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const progress = useMotionValue(0);

  const height = useTransform(
    progress,
    [0, 1],
    [metrics?.collapsed ?? 0, metrics?.full ?? 0],
  );
  // Closed, the fade sits on the bottom edge and eats the peeking sliver. Open,
  // both stops are past the end — nothing is hidden, so there's nothing to hint
  // at, and the last card keeps its shadow.
  //
  // A list with nothing behind the fold gets both stops parked past any height
  // the section could have, rather than the property being dropped: once motion
  // has written a mask onto the element, handing it `undefined` leaves the last
  // one it wrote. A poll that shortens the list below the preview — a run of
  // one song collapsing under de-duplication — would otherwise keep fading at a
  // stop measured for rows that are no longer there.
  const solid = useTransform(
    progress,
    [0, 1],
    expandable
      ? [(metrics?.collapsed ?? 0) - FADE, metrics?.full ?? 0]
      : [OPAQUE, OPAQUE],
  );
  const clear = useTransform(
    progress,
    [0, 1],
    expandable
      ? [metrics?.collapsed ?? 0, (metrics?.full ?? 0) + FADE]
      : [OPAQUE, OPAQUE],
  );
  const mask = useMotionTemplate`linear-gradient(to bottom, #000 0px, #000 ${solid}px, transparent ${clear}px)`;

  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el) return;

    // A card on its way out is still a child, pinned where it was — so the
    // list is measured from the ones that are actually holding a place in it.
    const nodes = (Array.from(el.children) as HTMLElement[]).filter(
      (node) => getComputedStyle(node).position !== "absolute",
    );
    if (nodes.length < tracks.length) return;

    // `offsetTop`/`offsetHeight` rather than bounding boxes: the cards carry a
    // transform at rest, and a measured box would fold the tuck and the shrink
    // back into the numbers the tuck is computed from.
    const fold = nodes[preview - 1];
    const last = nodes[tracks.length - 1];
    if (!fold || !last) return;

    setMetrics({
      collapsed:
        fold.offsetTop + fold.offsetHeight - TUCK * (preview - 1) + PEEK,
      full: last.offsetTop + last.offsetHeight + PAD,
    });
  }, [tracks.length, preview]);

  // Measured before paint, so the collapsed height is in place on the same
  // frame the extra cards mount.
  useLayoutEffect(measure, [mounted, measure]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // Re-measure when the cards rewrap at a new width.
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

  const cards = mounted ? tracks : tracks.slice(0, preview);
  const keys = keysFor(cards);
  const drawer = expandable && metrics !== null;
  const deck = expandable && !expanded;

  // Before the first measurement the document has the cards at their untucked
  // heights, which leaves the stack floating above a hole exactly the size of
  // the tuck it hasn't been told about. Constant, and independent of how tall a
  // card turns out to be, so the unmeasured state lands where the measured one
  // will and hydration doesn't shift the page.
  const settle = PEEK - PAD - TUCK * (preview - 1);

  // All or nothing in practice — Spotify has art for everything, the
  // hand-written fallback for nothing. Ten empty tiles would just read as a
  // broken grid, so without art the cards keep their plain layout.
  const hasArt = tracks.some((track) => track.image);

  return (
    <section aria-label="Latest playing" style={{ overflowAnchor: "none" }}>
      {/*
        The live marker sits with the heading rather than on the card's album
        art. Over the art it needed a scrim to stay legible, which meant the
        one cover with anything happening to it was the one you could see
        least — and it read as a play button, as though the tile were a
        control. Up here it's just a status next to the word that states it.
      */}
      {/*
        Three states, not two. A paused player still has a track loaded, and
        saying "Playing now" over it would be wrong while dropping it entirely
        is how pausing used to make the song disappear.

        "Paused" is only claimed while Spotify is still reporting the track. A
        held one — the session went idle and took the answer with it — falls
        back to the neutral wording, because by then we know what was last on
        but nothing about the player.
      */}
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-muted/70">
        {playing ? "Playing now" : current && !held ? "Paused" : "Latest playing"}
        {playing ? <AudioLines /> : <PlayOff />}
      </p>

      {/*
        Bled out sideways and padded back in: the clip that hides the deck would
        otherwise cut the cards' shadows off flat against both edges.
      */}
      <motion.div
        className="-mx-3 mt-4 overflow-hidden px-3"
        style={{
          height: drawer ? height : "auto",
          // Nothing is hidden when the list is short, so a fade would be a lie.
          maskImage: drawer ? mask : expandable ? STATIC_MASK : "none",
          WebkitMaskImage: drawer ? mask : expandable ? STATIC_MASK : "none",
        }}
      >
        <ol
          ref={listRef}
          className="relative flex flex-col"
          style={{
            gap: GAP,
            paddingBottom: PAD,
            marginBottom: drawer || !expandable ? 0 : settle,
          }}
        >
          {/*
            `popLayout` takes the card falling off the end out of the flow the
            moment it starts leaving, rather than letting it hold its slot for
            the length of its fade. Held, it pushes the last real card past the
            end of the drawer, which then has to slide back up from under the
            clip once the fade finishes — the whole list settles and then the
            bottom of it moves again.
          */}
          <AnimatePresence initial={false} mode="popLayout">
            {cards.map((track, i) => (
              /*
                Two elements per card on purpose. The outer one owns the card's
                place in the list — arriving, leaving, and sliding down when
                something lands above it. The inner one owns where that card
                sits in the deck. Kept apart because both animate a transform,
                and one element can only have the one.
              */
              <motion.li
                key={keys[i]}
                layout
                // Blocked by `AnimatePresence initial={false}` for the cards
                // that are there on the first render, so this only ever runs
                // for a song that actually arrived. The server renders the
                // settled state either way.
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  transition: still ? instant : trackLeave,
                }}
                transition={still ? instant : trackShift}
                // Front of the deck paints over the back of it. Without this,
                // document order does the opposite and each card is tucked
                // *over* the one it should be sliding under.
                style={{ position: "relative", zIndex: cards.length - i }}
                aria-hidden={expandable && i >= preview && !expanded}
              >
                <motion.div
                  // The depth a card mounts at is simply the depth it has —
                  // there's nothing to animate from, and a stack that assembled
                  // itself on every hydration would be a party trick.
                  initial={false}
                  animate={deck ? stacked(i, preview) : FLAT}
                  transition={
                    still ? instant : expanded ? curtainOpen : curtainClose
                  }
                  style={{ transformOrigin: "center top" }}
                  className={`track-card flex items-center gap-3 rounded-xl px-3 ${
                    hasArt ? "py-2" : "py-2.5"
                  }`}
                >
                  <CardBody track={track} hasArt={hasArt} />
                </motion.div>
              </motion.li>
            ))}
          </AnimatePresence>
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
