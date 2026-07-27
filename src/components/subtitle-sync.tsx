"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The Doc Reels subtitle clock, running in the page.
 *
 * Same model as the real player: word timings derived from character-level
 * timestamps, then a requestAnimationFrame loop finding the last word whose
 * start has passed. The drift slider is the interesting control — it shows why
 * this had to be timestamp-driven rather than a fixed interval per word.
 */

const SCRIPT =
  "okay so server functions are just functions that only ever run on the server, you call them like normal and the bundler strips the body out of the client build";

const WORDS_PER_LINE = 6;

type Timing = { word: string; start: number; end: number };

/** The mock model from the real app, used when there's no ElevenLabs key. */
function timings(text: string): Timing[] {
  const out: Timing[] = [];
  let t = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const dur = 0.09 + word.length * 0.055;
    out.push({ word, start: t, end: t + dur });
    t += dur;
    if (/[.!?,]$/.test(word)) t += 0.28;
  }
  return out;
}

const WORDS = timings(SCRIPT);
const DURATION = WORDS[WORDS.length - 1].end + 0.4;

export function SubtitleSync() {
  const reduce = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  /** Simulated clock error, in seconds — what naive fixed-interval timing does. */
  const [drift, setDrift] = useState(0);
  const raf = useRef(0);
  const clock = useRef({ elapsed: 0, resumedAt: 0 });

  useEffect(() => {
    if (!playing) return;
    // Captured up front so the cleanup below banks time against the same
    // object the loop advanced, not whatever the ref points at later.
    const c = clock.current;
    c.resumedAt = performance.now();

    const tick = () => {
      const t = c.elapsed + (performance.now() - c.resumedAt) / 1000;
      if (t >= DURATION) {
        c.elapsed = 0;
        setTime(0);
        setPlaying(false);
        return;
      }
      setTime(t);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      // Pausing banks elapsed time so resume picks up where it left off.
      c.elapsed += (performance.now() - c.resumedAt) / 1000;
      cancelAnimationFrame(raf.current);
    };
  }, [playing]);

  const toggle = useCallback(() => {
    if (time === 0 && !playing) clock.current.elapsed = 0;
    setPlaying((p) => !p);
  }, [playing, time]);

  const restart = useCallback(() => {
    cancelAnimationFrame(raf.current);
    clock.current.elapsed = 0;
    setTime(0);
    setPlaying(true);
  }, []);

  // The lookup the real player does every frame, plus whatever drift we
  // injected. Before the first play there is nothing to show — without the
  // `started` guard the opening line would sit there at t=0, since the first
  // word starts at exactly zero.
  const started = playing || time > 0;
  const t = time + drift;
  let index = -1;
  if (started) {
    for (let i = 0; i < WORDS.length; i++) {
      if (WORDS[i].start <= t) index = i;
      else break;
    }
  }

  const lineStart = Math.max(0, Math.floor(index / WORDS_PER_LINE) * WORDS_PER_LINE);
  const line = index >= 0 ? WORDS.slice(lineStart, lineStart + WORDS_PER_LINE) : [];
  const progress = Math.min(1, time / DURATION);

  return (
    <div className="my-8 select-none">
      <div className="rounded-2xl shadow-ring bg-background p-4">
        {/* The reel frame — 9:16 the way it actually renders */}
        <div className="mx-auto flex aspect-[9/16] w-full max-w-[14rem] flex-col justify-end overflow-hidden rounded-xl bg-[#12131a] p-4">
          <div className="mb-3 h-0.5 overflow-hidden rounded-full bg-white/15">
            {/* scaleX, not width — this updates every frame while playing. */}
            <div
              className="h-full w-full origin-left rounded-full bg-white/70"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>

          <p className="text-center text-[13px] font-medium leading-snug">
            {line.length === 0 ? (
              <span className="text-white/30">press play</span>
            ) : (
              line.map((w, i) => {
                const current = lineStart + i === index;
                // transform string rather than the `scale` shorthand: this
                // retargets on every word, and the shorthand would run on the
                // main thread alongside the playback loop.
                return (
                  <motion.span
                    key={`${lineStart + i}-${w.word}`}
                    animate={{
                      transform: `scale(${current && !reduce ? 1.08 : 1})`,
                    }}
                    transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                    className={`mx-0.5 inline-block transition-colors duration-100 ${
                      current ? "text-yellow-300" : "text-white/80"
                    }`}
                  >
                    {w.word}
                  </motion.span>
                );
              })
            )}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={playing ? toggle : time > 0 ? toggle : restart}
            className="pressable rounded-full shadow-ring px-4 py-1.5 text-sm hover:bg-surface"
          >
            {playing ? "Pause" : time > 0 ? "Resume" : "Play"}
          </button>
          {time > 0 && (
            <button
              type="button"
              onClick={restart}
              className="text-xs text-muted underline decoration-line underline-offset-4 transition-colors hover:decoration-foreground"
            >
              restart
            </button>
          )}
          <span className="ml-auto font-mono text-xs text-muted tabular-nums">
            {time.toFixed(2)}s
          </span>
        </div>

        <div className="mt-4 border-t border-line pt-3">
          <label
            htmlFor="drift"
            className="flex items-center justify-between text-xs text-muted"
          >
            <span>clock drift</span>
            <span className="font-mono tabular-nums">
              {drift > 0 ? "+" : ""}
              {drift.toFixed(2)}s
            </span>
          </label>
          <input
            id="drift"
            type="range"
            min={-0.6}
            max={0.6}
            step={0.02}
            value={drift}
            onChange={(e) => setDrift(Number(e.target.value))}
            className="mt-2 w-full accent-foreground"
          />
          <p aria-live="polite" className="mt-2 text-xs text-muted">
            {Math.abs(drift) < 0.08
              ? "In sync — the highlight lands on the word being said."
              : `Off by ${Math.abs(drift).toFixed(2)}s and it already reads as broken.`}
          </p>
        </div>
      </div>
    </div>
  );
}
