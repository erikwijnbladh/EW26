"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { NOW_PLAYING_COUNT, type Track } from "@/lib/data";
import { duration, ease, instant } from "@/lib/motion";
import type { Playing } from "@/lib/spotify";
import { usePlaying } from "@/components/use-playing";

const timeFormatter = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Europe/Stockholm",
});

const revealTransition = {
  height: { duration: 0.28, ease },
  opacity: { duration: 0.18, ease },
};

function keyFor(track: Track, index: number) {
  return (
    track.playedAt ??
    track.url ??
    `${track.title}::${track.artist}::${index}`
  );
}

function playedAt(track: Track, index: number) {
  if (!track.playedAt) return String(index + 2).padStart(2, "0");

  const date = new Date(track.playedAt);
  return Number.isNaN(date.getTime())
    ? String(index + 2).padStart(2, "0")
    : timeFormatter.format(date);
}

/** A quiet fallback that still reads as intentional when artwork is absent. */
function RecordMark() {
  return (
    <span className="flex size-full items-center justify-center bg-foreground/[0.055] text-muted/75">
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    </span>
  );
}

/** The player is advancing. Reduced motion leaves the equaliser still. */
function AudioLines() {
  const still = !!useReducedMotion();

  const bar = (rest: string, peak: string, barDuration: number) => (
    <motion.path
      key={rest}
      d={rest}
      initial={{ d: rest }}
      animate={still ? { d: rest } : { d: [rest, peak, rest] }}
      transition={
        still
          ? instant
          : { duration: barDuration, repeat: Infinity, ease: "easeInOut" }
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

function Chevron({ expanded, still }: { expanded: boolean; still: boolean }) {
  return (
    <motion.span
      className="inline-flex size-3.5 items-center justify-center"
      initial={false}
      animate={{ rotate: expanded ? 180 : 0 }}
      transition={still ? instant : { duration: duration.fast, ease }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="size-3.5"
        fill="none"
      >
        <path
          d="m7 10 5 5 5-5"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.span>
  );
}

function Artwork({ track }: { track: Track }) {
  return (
    <span className="relative size-8 shrink-0 overflow-hidden rounded-[4px]">
      {track.image ? (
        <Image
          src={track.image}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      ) : (
        <RecordMark />
      )}
    </span>
  );
}

/**
 * The one stable surface in the widget. It never participates in the history
 * animation, so polling, opening, and closing cannot change its geometry.
 */
function FeaturedTrack({ track }: { track: Track }) {
  const contents = (
    <>
      <Artwork track={track} />
      <span className="min-w-0 truncate text-[15px] font-medium leading-5 text-foreground">
        {track.title}
      </span>
      <span className="min-w-0 truncate text-right text-sm font-light leading-5 text-muted">
        {track.artist}
      </span>
    </>
  );

  const className =
    "listening-link listening-feature -mx-2 grid h-14 grid-cols-[2rem_minmax(0,1fr)_minmax(0,0.58fr)] items-center gap-3 rounded-xl px-3 outline-none focus-visible:ring-2 focus-visible:ring-foreground/25";

  if (!track.url) return <div className={className}>{contents}</div>;

  return (
    <a
      href={track.url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${track.title} by ${track.artist} — open in Spotify`}
      className={`${className} listening-pressable`}
    >
      {contents}
    </a>
  );
}

function HistoryRow({ track, index }: { track: Track; index: number }) {
  const label = playedAt(track, index);
  const contents = (
    <>
      {track.playedAt ? (
        <time dateTime={track.playedAt} className="text-xs text-muted/75">
          {label}
        </time>
      ) : (
        <span className="text-xs tabular-nums text-muted/75">{label}</span>
      )}
      <span className="min-w-0 truncate text-sm leading-5 text-foreground/80">
        {track.title}
      </span>
      <span className="min-w-0 truncate text-right text-sm font-light leading-5 text-muted">
        {track.artist}
      </span>
    </>
  );

  const className =
    "listening-link -mx-2 grid min-h-9 grid-cols-[2.75rem_minmax(0,1.25fr)_minmax(0,0.75fr)] items-baseline rounded-md px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 sm:grid-cols-[3.25rem_minmax(0,1.45fr)_minmax(0,1fr)]";

  if (!track.url) return <li className={className}>{contents}</li>;

  return (
    <li>
      <a
        href={track.url}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${track.title} by ${track.artist} — open in Spotify`}
        className={className}
      >
        {contents}
      </a>
    </li>
  );
}

/**
 * A favicon-scale current track with a chronological listening log beneath it.
 * The current row remains pinned while the log opens in normal document flow;
 * only the log's clipping height and collective opacity animate.
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
  const still = !!useReducedMotion();

  // Keep the widget at ten visible facts in total. The featured track is the
  // current player state when one exists, otherwise the newest logged play.
  const tracks = (current ? [current, ...history] : history).slice(
    0,
    NOW_PLAYING_COUNT,
  );
  const featured = tracks[0];
  const log = tracks.slice(1);

  if (!featured) return null;

  const heading = playing
    ? "Playing now"
    : current && !held
      ? "Paused"
      : "Latest playing";

  return (
    <section aria-label="Listening" className="[overflow-anchor:none]">
      <p className="flex h-4 items-center gap-2 text-xs leading-4 text-muted/75">
        {heading}
        {playing ? <AudioLines /> : <PlayOff />}
      </p>

      <div className="mt-3">
        <FeaturedTrack track={featured} />
      </div>

      {log.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls="listening-history"
            aria-label={
              expanded
                ? "Hide listening log"
                : `Show listening log, ${log.length} previous tracks`
            }
            className="listening-pressable mt-2 flex min-h-10 w-full items-center gap-2 rounded-md text-[13px] text-muted/80 outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/25 max-sm:min-h-11"
          >
            {expanded ? (
              <>
                <span>Listening log</span>
                <span className="ml-auto text-xs text-muted/70">Hide</span>
              </>
            ) : (
              <>
                <span className="shrink-0 text-xs text-muted/70">
                  Before that
                </span>
                <span
                  className="size-[3px] shrink-0 rounded-full bg-muted/55"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-left">
                  {log[0].title}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted/65">
                  {log.length}
                </span>
              </>
            )}
            <Chevron expanded={expanded} still={still} />
          </button>

          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.div
                id="listening-history"
                key="listening-history"
                initial={still ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={still ? instant : revealTransition}
                className="overflow-hidden"
              >
                <ol className="pb-1 pt-1">
                  {log.map((track, index) => (
                    <HistoryRow
                      key={keyFor(track, index)}
                      track={track}
                      index={index}
                    />
                  ))}
                </ol>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      ) : null}
    </section>
  );
}
