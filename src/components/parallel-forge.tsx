"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The Mythforge generation model, running for real in the page.
 *
 * Three generators with different latencies, each writing its own status.
 * The point is what you can *see*: panels settle out of order, a failure is
 * contained to one panel, and nothing waits on the slowest. Same shape as the
 * edge function — Promise.allSettled over three tasks, one status per output.
 */

type Status = "idle" | "generating" | "ready" | "failed";

type Panel = {
  id: string;
  label: string;
  /** Roughly what each generator costs in the real thing. */
  ms: number;
  body: string[];
};

const PANELS: Panel[] = [
  { id: "sheet", label: "Character sheet", ms: 1400, body: ["AC 12", "HP 38", "Level 3"] },
  { id: "portrait", label: "Portrait", ms: 3600, body: [] },
  { id: "voice", label: "Voice line", ms: 2400, body: ['"Ah, there ye are at last."'] },
];

/** Serial version, for contrast: you wait for the slowest, always. */
const SERIAL_MS = PANELS.reduce((n, p) => n + p.ms, 0);
const PARALLEL_MS = Math.max(...PANELS.map((p) => p.ms));

export function ParallelForge() {
  const reduce = useReducedMotion();
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [running, setRunning] = useState(false);
  const [failPortrait, setFailPortrait] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const raf = useRef(0);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => clear, [clear]);

  const run = useCallback(() => {
    clear();
    setRunning(true);
    setElapsed(0);
    setStatuses(Object.fromEntries(PANELS.map((p) => [p.id, "generating"])));

    const started = performance.now();
    const tick = () => {
      const t = performance.now() - started;
      setElapsed(Math.min(t, PARALLEL_MS));
      if (t < PARALLEL_MS) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    // Each generator settles on its own clock — no barrier between them.
    PANELS.forEach((panel) => {
      const failed = failPortrait && panel.id === "portrait";
      timers.current.push(
        setTimeout(() => {
          setStatuses((s) => ({ ...s, [panel.id]: failed ? "failed" : "ready" }));
        }, panel.ms),
      );
    });

    timers.current.push(setTimeout(() => setRunning(false), PARALLEL_MS));
  }, [clear, failPortrait]);

  const started = Object.keys(statuses).length > 0;
  const readyCount = PANELS.filter((p) => statuses[p.id] === "ready").length;

  return (
    <div className="my-8 select-none">
      <div className="rounded-2xl shadow-ring bg-background p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="pressable rounded-full shadow-ring px-4 py-1.5 text-sm hover:bg-surface disabled:opacity-40"
          >
            {started ? "Forge again" : "Forge"}
          </button>

          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={failPortrait}
              onChange={(e) => setFailPortrait(e.target.checked)}
              className="accent-foreground"
            />
            fail the portrait
          </label>

          <span className="ml-auto font-mono text-xs text-muted tabular-nums">
            {started ? `${(elapsed / 1000).toFixed(1)}s` : `${(PARALLEL_MS / 1000).toFixed(1)}s`}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {PANELS.map((panel) => {
            const status = statuses[panel.id] ?? "idle";
            return (
              <div
                key={panel.id}
                className="rounded-xl border border-line p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs">{panel.label}</span>
                  <StatusBadge status={status} reduce={Boolean(reduce)} />
                </div>

                <div className="mt-3 min-h-14 text-xs text-muted">
                  <AnimatePresence mode="wait" initial={false}>
                    {status === "generating" && (
                      <motion.div
                        key="gen"
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={reduce ? undefined : { opacity: 0 }}
                        className="space-y-1.5"
                      >
                        {[0, 1].map((i) => (
                          <div
                            key={i}
                            className="skeleton h-2 rounded bg-surface"
                            style={{
                              width: i ? "60%" : "85%",
                              animationDelay: `${i * 150}ms`,
                            }}
                          />
                        ))}
                      </motion.div>
                    )}

                    {status === "ready" && (
                      <motion.div
                        key="ready"
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                        className="space-y-1"
                      >
                        {panel.id === "portrait" ? (
                          <div className="h-14 rounded bg-gradient-to-br from-[#0f766e] to-[#5eead4]" />
                        ) : (
                          panel.body.map((line) => <div key={line}>{line}</div>)
                        )}
                      </motion.div>
                    )}

                    {status === "failed" && (
                      <motion.div
                        key="failed"
                        initial={reduce ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <p>Generation failed.</p>
                        <button
                          type="button"
                          onClick={run}
                          className="mt-1 underline decoration-line underline-offset-4 transition-colors hover:decoration-foreground"
                        >
                          Retry
                        </button>
                      </motion.div>
                    )}

                    {status === "idle" && (
                      <motion.p key="idle" initial={false}>
                        Not started.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        <p
          aria-live="polite"
          className="mt-4 border-t border-line pt-3 text-xs text-muted"
        >
          {!started
            ? `Three generators, one row. Serial would take ${(SERIAL_MS / 1000).toFixed(1)}s — this finishes in ${(PARALLEL_MS / 1000).toFixed(1)}s, and each panel is usable the moment it lands.`
            : running
              ? `${readyCount} of ${PANELS.length} ready — the sheet is already usable.`
              : failPortrait
                ? "The portrait failed. The sheet and voice are unaffected — that's the point of a status per output."
                : `Done in ${(PARALLEL_MS / 1000).toFixed(1)}s instead of ${(SERIAL_MS / 1000).toFixed(1)}s. Nothing waited on the slowest.`}
        </p>
      </div>
    </div>
  );
}

/**
 * The label swaps words mid-flight, so a plain crossfade shows two of them
 * overlapping. A touch of blur bridges them into a single change.
 */
function StatusBadge({ status, reduce }: { status: Status; reduce: boolean }) {
  const label =
    status === "ready" ? "READY" : status === "failed" ? "FAILED" : status === "generating" ? "…" : "—";

  return (
    <motion.span
      key={status}
      initial={reduce ? false : { opacity: 0, filter: "blur(3px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={`rounded-full border px-1.5 py-0.5 font-mono text-[10px] ${
        status === "ready"
          ? "border-line text-foreground"
          : status === "failed"
            ? "border-line text-foreground opacity-60"
            : "border-line text-muted"
      }`}
    >
      {label}
    </motion.span>
  );
}
