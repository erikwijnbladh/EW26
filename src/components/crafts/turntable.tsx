"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import type { Playing } from "@/lib/spotify";
import { usePlaying } from "@/components/use-playing";

/** Degrees per second at each speed. 33⅓ rpm is 200°/s. */
const RPM = { 33: 200, 45: 270 } as const;

/** Where the tonearm swings to, around its pivot, to sit in the grooves. */
const ARM_ON = 24;

/** Normalises an angle difference into (-180, 180]. */
function wrap(delta: number) {
  return ((((delta + 180) % 360) + 360) % 360) - 180;
}

/**
 * The live Spotify track as a record on a platter.
 *
 * The platter is a physics toy rather than an animation: it has a speed, and
 * the speed chases a target. Lifting the arm or pausing the player sets the
 * target to zero and the record coasts down; grabbing it sets the angle under
 * the pointer directly, and letting go hands the flick's velocity back to the
 * motor. The sheen doesn't rotate — the light is in the room, not the vinyl.
 */
export function Turntable({ initial }: { initial: Playing }) {
  const shown = usePlaying(initial);
  const still = !!useReducedMotion();
  const track = shown.current ?? shown.history[0] ?? null;
  const live = !!shown.current && shown.playing && !shown.held;

  const [lifted, setLifted] = useState(false);
  const [speed, setSpeed] = useState<33 | 45>(33);
  const armDown = !!track && !lifted;
  const spinning = armDown && live && !still;

  const angle = useMotionValue(0);
  const platter = useRef<HTMLDivElement>(null);
  const state = useRef({ velocity: 0, target: 0, held: false, last: 0, lastT: 0 });

  useEffect(() => {
    state.current.target = spinning ? RPM[speed] : 0;
  }, [spinning, speed]);

  useEffect(() => {
    let frame = 0;
    let prev = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const s = state.current;

      if (!s.held) {
        // Spin-up is a motor, spin-down is friction: the first is quicker.
        const rate = s.target > s.velocity ? 3.2 : 1.1;
        s.velocity += (s.target - s.velocity) * Math.min(1, rate * dt);
        if (Math.abs(s.velocity) > 0.05) angle.set(angle.get() + s.velocity * dt);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [angle]);

  function pointerAngle(event: React.PointerEvent) {
    const box = platter.current!.getBoundingClientRect();
    const x = event.clientX - (box.left + box.width / 2);
    const y = event.clientY - (box.top + box.height / 2);
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function grab(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    Object.assign(state.current, {
      held: true,
      velocity: 0,
      last: pointerAngle(event),
      lastT: performance.now(),
    });
  }

  function scratch(event: React.PointerEvent<HTMLDivElement>) {
    const s = state.current;
    if (!s.held) return;

    const now = performance.now();
    const next = pointerAngle(event);
    const delta = wrap(next - s.last);
    angle.set(angle.get() + delta);

    const dt = Math.max(1, now - s.lastT) / 1000;
    // Smoothed, so one jittery sample doesn't become the release velocity.
    s.velocity = s.velocity * 0.6 + (delta / dt) * 0.4;
    s.last = next;
    s.lastT = now;
  }

  function release() {
    state.current.held = false;
  }

  const status = !track
    ? "Nothing on the platter"
    : live
      ? "Now spinning"
      : shown.current
        ? "Paused"
        : "Last played";

  return (
    <div className="relative aspect-square w-full select-none">
      {/* Platter mat — sits under the record and never moves. */}
      <div className="absolute left-[44%] top-[46%] size-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/[0.07] shadow-[inset_0_1px_3px_rgba(21,20,15,0.18)]" />

      <motion.div
        ref={platter}
        role="img"
        aria-label={
          track ? `Record: ${track.title} by ${track.artist}` : "An empty record"
        }
        onPointerDown={grab}
        onPointerMove={scratch}
        onPointerUp={release}
        onPointerCancel={release}
        style={{ rotate: angle }}
        className="vinyl absolute left-[44%] top-[46%] size-[72%] -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full active:cursor-grabbing"
      >
        <div className="absolute left-1/2 top-1/2 size-[36%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-[#e5532d] shadow-[0_0_0_2px_rgba(0,0,0,0.5)]">
          {track?.image ? (
            <Image
              src={track.image}
              alt=""
              fill
              sizes="120px"
              draggable={false}
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center font-serif text-lg italic text-white/90">
              ew
            </span>
          )}
        </div>
      </motion.div>

      {/* Room light, static over the spinning record. */}
      <div className="vinyl-sheen pointer-events-none absolute left-[44%] top-[46%] size-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="pointer-events-none absolute left-[44%] top-[46%] size-[2.4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-white to-neutral-400 shadow-sm" />

      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 size-full"
        aria-hidden={false}
      >
        <g
          role="button"
          tabIndex={0}
          aria-label={lifted ? "Lower the tonearm" : "Lift the tonearm"}
          aria-pressed={!lifted}
          onClick={() => setLifted((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setLifted((v) => !v);
            }
          }}
          className="pointer-events-auto cursor-pointer outline-none [&:focus-visible_.arm]:stroke-[#e5532d]"
          style={{
            transformBox: "view-box",
            transformOrigin: "86px 14px",
            transform: `rotate(${armDown ? ARM_ON : 0}deg)`,
            transition: still
              ? "none"
              : "transform 900ms cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          {/* A fat invisible stroke, so the arm is easy to hit. */}
          <path d="M86 14 L86 60 L82 70" stroke="transparent" strokeWidth={10} fill="none" />
          <path
            className="arm"
            d="M86 14 L86 60 L82 70"
            stroke="var(--foreground)"
            strokeOpacity={0.8}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x={79.4} y={67.5} width={5} height={7} rx={1} fill="var(--foreground)" transform="rotate(22 82 71)" />
          <circle cx={86} cy={14} r={5.2} fill="var(--floating-surface)" stroke="var(--foreground)" strokeOpacity={0.2} />
          <circle cx={86} cy={14} r={2} fill="var(--foreground)" fillOpacity={0.75} />
        </g>
        {/* Arm rest. */}
        <rect x={84.2} y={64} width={3.6} height={9} rx={1.8} fill="var(--foreground)" fillOpacity={0.12} />
      </svg>

      {/* 33 / 45 — the only control that's purely for fun. */}
      <div className="absolute bottom-[5%] right-[5%] flex rounded-full bg-foreground/[0.06] p-0.5 font-mono text-[10px]">
        {([33, 45] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSpeed(value)}
            aria-pressed={speed === value}
            className={`rounded-full px-2 py-0.5 transition-colors ${
              speed === value
                ? "bg-[var(--floating-surface)] text-foreground shadow-sm"
                : "text-muted/70 hover:text-foreground"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="absolute bottom-[5%] left-[6%] right-[30%] min-w-0">
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted/70">
          <span
            className={`size-1.5 rounded-full ${
              live ? "led-live bg-[#e5532d]" : "bg-foreground/25"
            }`}
          />
          {status}
        </p>
        {track && (
          <p className="mt-1 truncate text-xs">
            {track.url ? (
              <a
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:underline"
              >
                {track.title}
              </a>
            ) : (
              <span className="font-medium text-foreground">{track.title}</span>
            )}
            <span className="text-muted"> — {track.artist}</span>
          </p>
        )}
      </div>
    </div>
  );
}
