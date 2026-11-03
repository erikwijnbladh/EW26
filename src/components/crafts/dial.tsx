"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { experience } from "@/lib/data";
import { easeGlide } from "@/lib/motion";

/** Oldest first, so turning clockwise moves forward in time. */
const STOPS = [...experience].reverse();
const LAST = STOPS.length - 1;

/** The sweep the detents are spread over, centred on twelve o'clock. */
const SWEEP = 240;
const detent = (i: number) => -SWEEP / 2 + (i * SWEEP) / LAST;
const nearest = (deg: number) =>
  Math.max(0, Math.min(LAST, Math.round(((deg + SWEEP / 2) / SWEEP) * LAST)));

/** How far past either end you can drag before it stops giving. */
const OVERRUN = 18;

const SNAP = { type: "spring", stiffness: 520, damping: 34, mass: 0.6 } as const;

function wrap(delta: number) {
  return ((((delta + 180) % 360) + 360) % 360) - 180;
}

/** Past the ends the knob still turns, but it gets heavier the further you go. */
function resist(deg: number) {
  const lo = detent(0);
  const hi = detent(LAST);
  if (deg > hi) return hi + OVERRUN * Math.tanh((deg - hi) / OVERRUN);
  if (deg < lo) return lo - OVERRUN * Math.tanh((lo - deg) / OVERRUN);
  return deg;
}

/**
 * The CV as a rotary selector. Drag it round, scroll over it, or use the
 * arrow keys — it clicks into a detent per role, and the readout above it
 * follows the detent nearest the pointer rather than waiting for the snap.
 */
export function Dial() {
  const still = !!useReducedMotion();
  const rot = useMotionValue(detent(LAST));
  const [active, setActive] = useState(LAST);
  const [dir, setDir] = useState(1);
  const knob = useRef<HTMLDivElement>(null);
  const drag = useRef({ on: false, last: 0, raw: 0 });

  useMotionValueEvent(rot, "change", (deg) => {
    const next = nearest(deg);
    setActive((prev) => {
      if (prev !== next) {
        setDir(next > prev ? 1 : -1);
        // A detent you can feel, where the device lets you.
        if (drag.current.on) navigator.vibrate?.(4);
      }
      return next;
    });
  });

  function go(index: number) {
    const i = Math.max(0, Math.min(LAST, index));
    if (still) rot.set(detent(i));
    else animate(rot, detent(i), SNAP);
  }

  // Wheel has to be non-passive to keep the page from scrolling under it.
  useEffect(() => {
    const el = knob.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      acc += event.deltaY + event.deltaX;
      if (Math.abs(acc) < 40) return;
      const step = acc > 0 ? 1 : -1;
      acc = 0;
      go(nearest(rot.get()) + step);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // `go` only closes over stable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rot]);

  function pointerAngle(event: React.PointerEvent) {
    const box = knob.current!.getBoundingClientRect();
    const x = event.clientX - (box.left + box.width / 2);
    const y = event.clientY - (box.top + box.height / 2);
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function onDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    rot.stop();
    drag.current = { on: true, last: pointerAngle(event), raw: rot.get() };
  }

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d.on) return;
    const next = pointerAngle(event);
    d.raw += wrap(next - d.last);
    d.last = next;
    rot.set(resist(d.raw));
  }

  function onUp() {
    if (!drag.current.on) return;
    drag.current.on = false;
    go(nearest(rot.get()));
  }

  const stop = STOPS[active];

  return (
    <div className="relative flex aspect-square w-full flex-col items-center select-none">
      {/* Readout */}
      <div className="relative mt-[8%] h-[25%] w-[78%] overflow-hidden rounded-2xl bg-foreground px-4 py-3 text-background shadow-[inset_0_1px_8px_rgba(0,0,0,0.5)]">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={active}
            custom={dir}
            initial={still ? false : { y: dir * 18, opacity: 0, filter: "blur(3px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={still ? { opacity: 0 } : { y: dir * -18, opacity: 0, filter: "blur(3px)" }}
            transition={{ duration: 0.22, ease: easeGlide }}
            className="flex h-full flex-col justify-center"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-background/50">
              {stop.year}
            </p>
            <p className="truncate font-serif text-xl leading-tight sm:text-2xl">
              {stop.href ? (
                <a href={stop.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {stop.org}
                </a>
              ) : (
                stop.org
              )}
            </p>
            <p className="truncate text-[11px] text-background/60">{stop.role}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dial */}
      <div className="relative mt-[6%] aspect-square w-[58%]">
        <svg viewBox="-50 -50 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden>
          {Array.from({ length: 41 }, (_, i) => {
            const deg = -SWEEP / 2 + (i * SWEEP) / 40;
            const major = STOPS.some((_, s) => Math.abs(detent(s) - deg) < 0.01);
            return (
              <line
                key={i}
                x1={0}
                y1={major ? -49 : -48}
                x2={0}
                y2={-45}
                transform={`rotate(${deg})`}
                stroke="var(--foreground)"
                strokeOpacity={major ? 0.6 : 0.18}
                strokeWidth={major ? 1.2 : 0.6}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {STOPS.map((s, i) => {
          const rad = ((detent(i) - 90) * Math.PI) / 180;
          return (
            <button
              key={s.org}
              type="button"
              tabIndex={-1}
              onClick={() => go(i)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] tabular-nums transition-colors ${
                i === active ? "text-foreground" : "text-muted/50 hover:text-muted"
              }`}
              style={{
                left: `${50 + Math.cos(rad) * 62}%`,
                top: `${50 + Math.sin(rad) * 62}%`,
              }}
            >
              {s.year.trim().endsWith("—") ? "now" : `'${s.year.slice(2, 4)}`}
            </button>
          );
        })}

        <div
          ref={knob}
          role="slider"
          tabIndex={0}
          aria-label="Career"
          aria-valuemin={0}
          aria-valuemax={LAST}
          aria-valuenow={active}
          aria-valuetext={`${stop.org}, ${stop.role}, ${stop.year}`}
          onKeyDown={(e) => {
            const step =
              e.key === "ArrowRight" || e.key === "ArrowUp"
                ? 1
                : e.key === "ArrowLeft" || e.key === "ArrowDown"
                  ? -1
                  : 0;
            if (e.key === "Home") go(0);
            else if (e.key === "End") go(LAST);
            else if (step) go(active + step);
            else return;
            e.preventDefault();
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="knob absolute inset-[14%] cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 active:cursor-grabbing"
        >
          <motion.div style={{ rotate: rot }} className="knob-knurl absolute inset-0 rounded-full">
            <div className="knob-face absolute inset-[9%] rounded-full">
              <span className="absolute left-1/2 top-[8%] h-[18%] w-[5%] -translate-x-1/2 rounded-full bg-[#e5532d]" />
            </div>
          </motion.div>
          {/* Light from above, fixed while the knob turns under it. */}
          <div className="knob-light pointer-events-none absolute inset-0 rounded-full" />
        </div>
      </div>
    </div>
  );
}
