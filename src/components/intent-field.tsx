"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

/**
 * A chat input that reads back what it understood before you commit.
 *
 * The demo is deliberately dumb — keyword matching, no model — because the
 * idea under test is interaction, not inference: showing intent while it is
 * still cheap to correct, instead of after a wrong answer has been generated.
 */

type Intent = {
  id: string;
  verb: string;
  /** What the assistant believes you want, phrased as a commitment. */
  reading: string;
  /** Words that vote for this intent. */
  cues: string[];
  /** What it would need but doesn't have yet. */
  missing?: string;
};

const INTENTS: Intent[] = [
  {
    id: "build",
    verb: "build",
    reading: "make something new, and show you the result",
    cues: ["build", "make", "create", "add", "generate", "write", "new"],
    missing: "where it should live",
  },
  {
    id: "fix",
    verb: "fix",
    reading: "find the cause first, then change as little as possible",
    cues: ["fix", "bug", "broken", "error", "fails", "wrong", "crash"],
    missing: "how to reproduce it",
  },
  {
    id: "explain",
    verb: "explain",
    reading: "explain it, and change nothing",
    cues: ["explain", "why", "how", "what", "understand", "mean", "does"],
  },
  {
    id: "review",
    verb: "review",
    reading: "look for problems and report, without fixing them",
    cues: ["review", "check", "look", "audit", "feedback", "thoughts", "read"],
  },
];

const HEDGES = ["maybe", "kind of", "sort of", "probably", "i think", "not sure", "or something", "idk"];

/** Below this, the reading hedges its own wording rather than committing. */
const LOW_CONFIDENCE = 0.5;

type Reading = {
  intent: Intent | null;
  confidence: number;
  hedged: boolean;
  score: number;
};

function read(input: string): Reading {
  const text = input.toLowerCase();
  const words = text.split(/\W+/).filter(Boolean);
  if (!words.length) return { intent: null, confidence: 0, hedged: false, score: 0 };

  const scored = INTENTS.map((intent) => ({
    intent,
    score: intent.cues.reduce((n, cue) => (words.includes(cue) ? n + 1 : n), 0),
  })).sort((a, b) => b.score - a.score);

  const [best, runnerUp] = scored;
  if (best.score === 0) return { intent: null, confidence: 0, hedged: false, score: 0 };

  const hedged = HEDGES.some((h) => text.includes(h));

  // Confidence falls when a second intent scores nearly as well, when the
  // message is very short, and when the phrasing hedges. An ambiguous ask
  // should look ambiguous.
  //
  // A hedge *caps* confidence rather than subtracting from it. "maybe add a
  // dark mode or something" matches the build cue cleanly, so a penalty just
  // lands it somewhere still-confident — which would be the exact laundering
  // this is arguing against. Certainty about the verb is not certainty about
  // the ask.
  const margin = (best.score - runnerUp.score) / best.score;
  const length = Math.min(1, words.length / 8);
  let confidence = 0.35 + margin * 0.4 + length * 0.25;
  if (hedged) confidence = Math.min(confidence, LOW_CONFIDENCE - 0.06);

  return {
    intent: best.intent,
    confidence: Math.max(0.15, Math.min(0.95, confidence)),
    hedged,
    score: best.score,
  };
}

const EXAMPLES = [
  "the dropdown is broken on mobile",
  "maybe add a dark mode or something",
  "why does this re-render twice",
  "can you look at my auth flow",
];

export function IntentField() {
  const [value, setValue] = useState("");
  const reduce = useReducedMotion();
  const reading = useMemo(() => read(value), [value]);

  const { intent, confidence, hedged } = reading;
  const pct = Math.round(confidence * 100);
  const low = confidence < LOW_CONFIDENCE;

  return (
    <div className="my-8 select-none">
      <div className="rounded-2xl shadow-ring bg-background p-4">
        <label htmlFor="intent-input" className="sr-only">
          Describe what you want
        </label>
        <input
          id="intent-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ask for something…"
          autoComplete="off"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted"
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setValue(ex)}
              className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>

        <div
          aria-live="polite"
          className="mt-4 border-t border-line pt-3 text-sm"
        >
          <AnimatePresence mode="wait" initial={false}>
            {intent ? (
              <motion.div
                key={intent.id + String(low)}
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              >
                <p className="text-muted">
                  {low ? "I might be about to " : "I'm about to "}
                  <span className="text-foreground">{intent.verb}</span> — {intent.reading}.
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <div
                    role="meter"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Confidence ${pct} percent`}
                    className="h-1 flex-1 overflow-hidden rounded-full bg-surface"
                  >
                    <motion.div
                      className="h-full rounded-full bg-foreground"
                      initial={false}
                      animate={{ width: `${pct}%`, opacity: low ? 0.4 : 1 }}
                      transition={
                        reduce
                          ? { duration: 0 }
                          : { duration: 0.3, ease: [0.2, 0, 0, 1] }
                      }
                    />
                  </div>
                  <span className="font-mono text-xs text-muted tabular-nums">
                    {pct}%
                  </span>
                </div>

                {(low || hedged || intent.missing) && (
                  <p className="mt-3 text-xs text-muted">
                    {hedged
                      ? "You hedged, so I'm hedging too — "
                      : low
                        ? "That could go a few ways — "
                        : ""}
                    {intent.missing
                      ? `tell me ${intent.missing} and I'll commit.`
                      : "say more and I'll commit."}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.p
                key="empty"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="text-muted"
              >
                {value.trim()
                  ? "I don't know what you want yet."
                  : "Nothing read yet."}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
