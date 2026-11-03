"use client";

import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";

const HOME = "Europe/Stockholm";

/** Milliseconds a zone is ahead of UTC at `date`. */
function zoneOffset(timeZone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUTC - (date.getTime() - date.getMilliseconds());
}

/** A guess at what Erik is doing, from the hour and day in Stockholm. */
function doing(hour: number, weekday: number) {
  const weekend = weekday === 0 || weekday === 6;
  if (hour < 7) return "Asleep. Probably.";
  if (hour < 9) return "Coffee, then commute";
  if (hour < 17) return weekend ? "Outside — skating or skiing" : "Building things at Compileit";
  if (hour < 20) return "Cooking something";
  return "At a gig, or one more game";
}

function formatDiff(ms: number) {
  const hours = Math.round(ms / 36e5 * 2) / 2;
  if (hours === 0) return "Same time as you";
  const n = Math.abs(hours);
  return `${n} hour${n === 1 ? "" : "s"} ${hours > 0 ? "ahead of" : "behind"} you`;
}

/**
 * Stockholm time on an analogue face, with a switch to the visitor's own.
 *
 * Switching zones doesn't jump the hands — the offset itself springs, so the
 * hour hand swings round the face through every hour in between, and the
 * difference is something you watch rather than read.
 */
export function Clock() {
  const still = !!useReducedMotion();
  const [zone, setZone] = useState<"home" | "you">("home");
  const [offsets, setOffsets] = useState({ home: 0, you: 0 });
  const [label, setLabel] = useState({ time: "", doing: "" });
  // Time is only known in the browser; until the first read, the face has no hands.
  const mounted = label.time !== "";

  const shift = useMotionValue(0);
  const t = useMotionValue(0);
  const sec = useTransform(t, (v) => ((v % 6e4) / 6e4) * 360);
  const min = useTransform(t, (v) => ((v % 36e5) / 36e5) * 360);
  const hr = useTransform(t, (v) => ((v % 432e5) / 432e5) * 360);

  useEffect(() => {
    const read = () => {
      const now = new Date();
      const you = -now.getTimezoneOffset() * 6e4;
      const home = zoneOffset(HOME, now);
      setOffsets({ home, you });
      const local = new Date(now.getTime() + home);
      setLabel({
        time: local.toISOString().slice(11, 16),
        doing: doing(local.getUTCHours(), local.getUTCDay()),
      });
      return { home, you };
    };


    let frame = 0;
    const tick = () => {
      t.set(Date.now() + shift.get());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(() => {
      // Always opens on Stockholm; the switch is the visitor's to flip.
      shift.set(read().home);
      tick();
    });
    const minute = setInterval(read, 15_000);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(minute);
    };
  }, [shift, t]);

  function choose(next: "home" | "you") {
    setZone(next);
    if (still) shift.set(offsets[next]);
    else animate(shift, offsets[next], { type: "spring", stiffness: 60, damping: 16 });
  }

  const same = offsets.home === offsets.you;

  return (
    <div className="relative flex aspect-square w-full flex-col items-center justify-center">
      <div className="absolute right-[5%] top-[5%] flex rounded-full bg-foreground/[0.06] p-0.5 text-[11px]">
        {(["home", "you"] as const).map((z) => (
          <button
            key={z}
            type="button"
            aria-pressed={zone === z}
            onClick={() => choose(z)}
            disabled={!mounted}
            className={`rounded-full px-2.5 py-0.5 transition-colors ${
              zone === z
                ? "bg-[var(--floating-surface)] text-foreground shadow-sm"
                : "text-muted/70 hover:text-foreground"
            }`}
          >
            {z === "home" ? "Stockholm" : "You"}
          </button>
        ))}
      </div>

      <div className="clock-face relative aspect-square w-[62%] rounded-full">
        <svg viewBox="-50 -50 100 100" className="absolute inset-0 size-full" aria-hidden>
          {Array.from({ length: 60 }, (_, i) => (
            <line
              key={i}
              x1={0}
              y1={i % 5 ? -44 : -41}
              x2={0}
              y2={-46}
              transform={`rotate(${i * 6})`}
              stroke="var(--foreground)"
              strokeOpacity={i % 5 ? 0.18 : 0.7}
              strokeWidth={i % 5 ? 0.6 : 1.4}
              strokeLinecap="round"
            />
          ))}
          <text y={18} textAnchor="middle" className="fill-[var(--muted)] font-mono" fontSize={5} letterSpacing={0.8}>
            {zone === "home" ? "STHLM" : "LOCAL"}
          </text>
        </svg>

        {mounted && (
          <>
            <Hand rotate={hr} className="h-[26%] w-[3.2%] bg-foreground" />
            <Hand rotate={min} className="h-[38%] w-[2.2%] bg-foreground" />
            <Hand rotate={sec} className="h-[44%] w-[0.9%] bg-[#e5532d]" tail />
          </>
        )}
        <span className="absolute left-1/2 top-1/2 size-[5%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e5532d] ring-2 ring-[var(--floating-surface)]" />
      </div>

      <div className="absolute bottom-[5%] left-[6%] right-[6%] flex items-end justify-between gap-3 text-xs">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted/70">
            {mounted ? `${label.time} in Stockholm` : "Stockholm"}
          </p>
          <p className="mt-1 truncate text-foreground">{mounted ? label.doing : " "}</p>
        </div>
        <p className="shrink-0 text-muted/70">
          {mounted ? (same ? "Same time as you" : formatDiff(offsets.home - offsets.you)) : ""}
        </p>
      </div>
    </div>
  );
}

function Hand({
  rotate,
  className,
  tail,
}: {
  rotate: MotionValue<number>;
  className: string;
  tail?: boolean;
}) {
  return (
    <motion.span
      style={{ rotate, transformOrigin: "50% 100%" }}
      className={`absolute bottom-1/2 left-1/2 -translate-x-1/2 rounded-full ${className}`}
    >
      {tail && <span className="absolute left-0 top-full h-[22%] w-full rounded-full bg-inherit" />}
    </motion.span>
  );
}
