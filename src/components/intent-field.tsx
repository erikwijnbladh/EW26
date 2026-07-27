"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useMemo, useState } from "react";

/**
 * A composer that answers a vague ask with the readings it could take, and
 * lets you tick the ones you meant.
 *
 * The classifier is a lookup table, deliberately — the idea under test is the
 * interaction. Enumerating the readings turns the moment of doubt into the
 * moment of authoring: you never correct a misunderstanding, because you pick
 * before one can happen.
 *
 * The approach is Niklas Muhs's; this is my small version of it.
 */

type Ask = {
  id: string;
  prompt: string;
  /** The readings this ask could plausibly carry. */
  readings: string[];
};

const ASKS: Ask[] = [
  {
    id: "games",
    prompt: "discuss video games",
    readings: [
      "compare the major genres",
      "recommend titles worth playing",
      "trace where the industry is heading",
      "argue about their effect on people",
      "explain how they get made",
    ],
  },
  {
    id: "auth",
    prompt: "look at my auth flow",
    readings: [
      "find security holes",
      "judge whether the code reads well",
      "check the flow makes sense to a user",
      "see if it scales",
      "just explain what it currently does",
    ],
  },
  {
    id: "dark",
    prompt: "maybe add a dark mode or something",
    readings: [
      "invert the palette and ship it",
      "build a proper theme system",
      "follow the OS setting only",
      "add a toggle people can find",
      "work out whether it's worth doing at all",
    ],
  },
];

export function IntentField() {
  const reduce = useReducedMotion();
  const [askId, setAskId] = useState(ASKS[0].id);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const ask = useMemo(() => ASKS.find((a) => a.id === askId)!, [askId]);

  const choose = useCallback((id: string) => {
    setAskId(id);
    setPicked(new Set());
  }, []);

  const toggle = useCallback((reading: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(reading)) next.delete(reading);
      else next.add(reading);
      return next;
    });
  }, []);

  const chosen = ask.readings.filter((r) => picked.has(r));

  return (
    <div className="my-8 select-none">
      <div className="rounded-2xl shadow-ring bg-background p-4">
        <div className="flex flex-wrap gap-1.5">
          {ASKS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => choose(a.id)}
              aria-pressed={a.id === askId}
              className={`pressable rounded-full border px-2.5 py-1 text-xs ${
                a.id === askId
                  ? "border-line bg-surface text-foreground"
                  : "border-line text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {a.prompt}
            </button>
          ))}
        </div>

        <p className="mt-4 border-t border-line pt-4 text-sm">
          What are you aiming for?
        </p>

        <ul className="mt-2 space-y-0.5">
          {ask.readings.map((reading) => {
            const on = picked.has(reading);
            return (
              <li key={reading}>
                <button
                  type="button"
                  onClick={() => toggle(reading)}
                  aria-pressed={on}
                  className="group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left text-sm transition-colors hover:bg-surface"
                >
                  <span
                    aria-hidden
                    className={`flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
                      on
                        ? "border-foreground bg-foreground"
                        : "border-line group-hover:border-muted"
                    }`}
                  >
                    <motion.svg
                      viewBox="0 0 12 12"
                      className="size-2.5 text-background"
                      initial={false}
                      animate={{ opacity: on ? 1 : 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      <path
                        d="M2.5 6.2 4.8 8.5 9.5 3.8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  </span>
                  <span className={on ? "text-foreground" : "text-muted"}>
                    {reading}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div
          aria-live="polite"
          className="mt-4 border-t border-line pt-3 text-sm"
        >
          <AnimatePresence mode="wait" initial={false}>
            {chosen.length === 0 ? (
              <motion.p
                key="empty"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.1 } }}
                transition={{ duration: 0.18 }}
                className="text-muted"
              >
                &ldquo;{ask.prompt}&rdquo; could mean any of {ask.readings.length}.
              </motion.p>
            ) : (
              <motion.div
                key="built"
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.1 } }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                <p className="text-xs text-muted">Sending</p>
                <p className="mt-1.5">
                  {ask.prompt} —{" "}
                  {chosen.map((r, i) => (
                    <span key={r}>
                      {i > 0 && (i === chosen.length - 1 ? ", and " : ", ")}
                      <span className="text-foreground">{r}</span>
                    </span>
                  ))}
                  .
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
