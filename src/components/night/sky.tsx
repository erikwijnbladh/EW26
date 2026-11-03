"use client";

import { useEffect, useState } from "react";
import { Dithering } from "@paper-design/shaders-react";

/**
 * The sky over Stockholm, at Stockholm's actual hour.
 *
 * A scene rather than a photo: a gradient sky, a dithered sun or moon on its
 * arc, northern lights after dark, a skyline whose windows come on in the
 * evening, and water below. Everything is keyed to one number — the hour —
 * so the slider underneath can scrub the whole day through it.
 */

type Palette = {
  top: string;
  mid: string;
  horizon: string;
  water: string;
  land: string;
  /** 0–1: how many windows are lit. */
  lit: number;
  /** 0–1: northern lights and stars. */
  night: number;
};

/** Key hours, interpolated between. Stockholm in autumn, roughly. */
const KEYS: [number, Palette][] = [
  [0, { top: "#03050d", mid: "#0a1328", horizon: "#14223f", water: "#060b18", land: "#05070d", lit: 0.25, night: 1 }],
  [5, { top: "#0b1230", mid: "#3a3561", horizon: "#e48a6a", water: "#1d2238", land: "#0d0f1a", lit: 0.35, night: 0.4 }],
  [7.5, { top: "#3f7fc4", mid: "#8fbbe3", horizon: "#f4d7b0", water: "#3b6a93", land: "#1a2230", lit: 0.05, night: 0 }],
  [15, { top: "#2f6fb8", mid: "#7fb0de", horizon: "#e9ecef", water: "#2f5d86", land: "#18202c", lit: 0.05, night: 0 }],
  [18, { top: "#1c2a5e", mid: "#a1506e", horizon: "#ff9d5c", water: "#3a2c45", land: "#120f18", lit: 0.6, night: 0.15 }],
  [20.5, { top: "#060a1c", mid: "#152045", horizon: "#3b3a6a", water: "#0b1026", land: "#07080f", lit: 0.85, night: 0.85 }],
  [24, { top: "#03050d", mid: "#0a1328", horizon: "#14223f", water: "#060b18", land: "#05070d", lit: 0.25, night: 1 }],
];

function hex(c: string) {
  const n = parseInt(c.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number) {
  const [x, y] = [hex(a), hex(b)];
  return `#${x
    .map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0"))
    .join("")}`;
}

function paletteAt(hour: number): Palette {
  const i = KEYS.findIndex(([h]) => h > hour) - 1;
  const [h0, a] = KEYS[Math.max(0, i)];
  const [h1, b] = KEYS[Math.max(1, i + 1)];
  const t = Math.min(1, Math.max(0, (hour - h0) / (h1 - h0)));
  return {
    top: mix(a.top, b.top, t),
    mid: mix(a.mid, b.mid, t),
    horizon: mix(a.horizon, b.horizon, t),
    water: mix(a.water, b.water, t),
    land: mix(a.land, b.land, t),
    lit: a.lit + (b.lit - a.lit) * t,
    night: a.night + (b.night - a.night) * t,
  };
}

function phaseName(hour: number) {
  if (hour < 5) return ["Natt", "Night"];
  if (hour < 7.5) return ["Gryning", "Dawn"];
  if (hour < 17) return ["Dag", "Day"];
  if (hour < 20.5) return ["Skymning", "Dusk"];
  return ["Natt", "Night"];
}

function stockholmHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    hourCycle: "h23",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get("hour") + get("minute") / 60;
}

const fmt = (hour: number) => {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour % 1) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Buildings, left to right, on a 160×40 ground. [x, width, height, roof] */
const BLOCKS: [number, number, number, "flat" | "gable"][] = [
  [0, 9, 10, "gable"], [9, 7, 13, "flat"], [16, 10, 11, "gable"], [26, 6, 15, "gable"],
  [32, 9, 12, "flat"], [41, 8, 9, "gable"], [49, 8, 13, "gable"], [66, 9, 11, "gable"],
  [75, 7, 14, "flat"], [82, 9, 10, "gable"], [91, 8, 12, "gable"], [110, 9, 13, "gable"],
  [119, 4, 10, "flat"], [137, 8, 12, "gable"], [145, 7, 9, "flat"], [152, 8, 14, "gable"],
];

/** A fixed scatter of windows, so the skyline is the same on every render. */
function windows() {
  const out: { x: number; y: number; seed: number }[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (const [x, w, h] of BLOCKS) {
    for (let wy = 40 - h + 3; wy < 38; wy += 2.6) {
      for (let wx = x + 1.5; wx < x + w - 1.5; wx += 2.4) {
        out.push({ x: wx, y: wy, seed: rnd() });
      }
    }
  }
  return out;
}

/** Computed once: the scatter is fixed, so there's nothing to recompute. */
const LIGHTS = windows();

export function Sky() {
  const [now, setNow] = useState<number | null>(null);
  const [scrub, setScrub] = useState<number | null>(null);

  useEffect(() => {
    const read = () => setNow(stockholmHour());
    const first = requestAnimationFrame(read);
    const timer = setInterval(read, 30_000);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(timer);
    };
  }, []);

  const hour = scrub ?? now ?? 21;
  const p = paletteAt(hour);
  const [sv, en] = phaseName(hour);

  // The sun's arc: up at six, down at twenty, highest at one.
  const day = (hour - 6) / 14;
  const sunUp = day > -0.05 && day < 1.05;
  const arc = sunUp ? day : ((hour + 24 - 20) % 24) / 10;
  const bodyX = 8 + arc * 84;
  const bodyY = 62 - Math.sin(Math.min(1, Math.max(0, arc)) * Math.PI) * 48;

  return (
    <figure>
      <div
        className={`sky relative aspect-[16/10] w-full overflow-hidden transition-opacity duration-700 ${
          now === null ? "opacity-0" : "opacity-100"
        }`}
        style={{
          background: `linear-gradient(to bottom, ${p.top}, ${p.mid} 52%, ${p.horizon} 74%)`,
        }}
        role="img"
        aria-label={`The sky over Stockholm at ${fmt(hour)}: ${en.toLowerCase()}`}
      >
        {/* Stars */}
        <div className="sky-stars absolute inset-0" style={{ opacity: p.night * 0.9 }} />

        {/* Norrsken */}
        <div
          className="absolute inset-x-0 top-0 h-[62%] [mask-image:linear-gradient(to_bottom,black,transparent)]"
          style={{ opacity: p.night * 0.75 }}
        >
          <Dithering
            speed={0.35}
            shape="warp"
            type="4x4"
            size={2}
            scale={0.7}
            colorBack="#00000000"
            colorFront="#5cf0a6"
            className="size-full"
          />
        </div>

        {/* Sun or moon */}
        <div
          className="absolute aspect-square w-[11%] -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${bodyX}%`, top: `${bodyY}%` }}
        >
          <Dithering
            speed={0.6}
            shape="sphere"
            type="4x4"
            size={2}
            scale={0.9}
            colorBack="#00000000"
            colorFront={sunUp ? "#ffd27a" : "#e9eef7"}
            className="size-full rounded-full"
          />
        </div>

        {/* Skyline */}
        <svg
          viewBox="0 0 160 40"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-x-0 bottom-[13%] h-[34%] w-full"
          aria-hidden
        >
          <g fill={p.land}>
            {BLOCKS.map(([x, w, h, roof]) => (
              <path
                key={x}
                d={
                  roof === "gable"
                    ? `M${x} 40 V${40 - h} L${x + w / 2} ${40 - h - 3} L${x + w} ${40 - h} V40 Z`
                    : `M${x} 40 V${40 - h} H${x + w} V40 Z`
                }
              />
            ))}
            {/* A cast-iron spire */}
            <path d="M57 40 V27 H66 V40 Z M58.5 27 L61.5 2 L64.5 27 Z" />
            {/* A brick tower with a lantern and three small crowns */}
            <path d="M99 40 V11 H108 V40 Z M100.5 11 V6.5 H106.5 V11 Z M102.2 6.5 L103.5 2.5 L104.8 6.5 Z" />
            <circle cx={101.6} cy={1.8} r={0.7} />
            <circle cx={103.5} cy={1.2} r={0.7} />
            <circle cx={105.4} cy={1.8} r={0.7} />
            {/* A copper dome */}
            <path d="M124 40 V30 H136 V40 Z M125 30 A5 5.5 0 0 1 135 30 Z M129.5 24.6 h1 v-3 h-1 Z" />
          </g>
          <g fill="#ffcf6b">
            {LIGHTS.map((w, i) =>
              w.seed < p.lit ? (
                <rect key={i} x={w.x} y={w.y} width={1} height={1.2} opacity={0.55 + w.seed * 0.45} />
              ) : null,
            )}
          </g>
        </svg>

        {/* Water */}
        <div
          className="absolute inset-x-0 bottom-0 h-[13%]"
          style={{ background: `linear-gradient(to bottom, ${p.water}, ${p.top})` }}
        >
          <Dithering
            speed={0.4}
            shape="wave"
            type="2x2"
            size={2}
            scale={1.6}
            colorBack="#00000000"
            colorFront={p.horizon}
            className="size-full opacity-30"
          />
        </div>

        <div className="sky-pixels pointer-events-none absolute inset-0" />
      </div>

      <figcaption className="mt-4 flex flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center">
        <span className="flex items-center gap-2">
          <span className="font-mono tabular-nums text-foreground">{now === null ? "--:--" : fmt(hour)}</span>
          <span>
            {sv} <span className="text-muted/60">· {en}</span>
          </span>
          {scrub === null ? (
            <span className="text-muted/60">in Stockholm, right now</span>
          ) : (
            <button
              type="button"
              onClick={() => setScrub(null)}
              className="rounded-full border border-line px-2 py-px text-[11px] text-foreground hover:bg-foreground/5"
            >
              Back to now
            </button>
          )}
        </span>
        <label className="flex flex-1 items-center gap-2 sm:ml-auto sm:max-w-56">
          <span className="sr-only">Scrub the time of day</span>
          <input
            type="range"
            min={0}
            max={23.99}
            step={0.05}
            value={hour}
            onChange={(e) => setScrub(Number(e.target.value))}
            className="sky-range w-full"
          />
        </label>
      </figcaption>
    </figure>
  );
}
