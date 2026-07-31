"use client";

import { useState } from "react";

/**
 * The argument, playable.
 *
 * One object, two ways in. The panel exposes every dimension the object has —
 * it is not a crippled control surface, it is a complete one. The box exposes
 * nothing at all.
 *
 * That symmetry is the whole point, and it's why the demo is worth poking
 * rather than describing. The panel's advantage isn't precision and the box's
 * advantage isn't access: both can reach every state. What separates them is
 * that the panel's vocabulary is finite and drawn on screen, and the box's is
 * neither — so the box can compose ("heavier" moves three controls at once,
 * and nobody had to anticipate it) and can also fail at nothing in particular.
 *
 * The parser below is regular expressions, not a model. Stated plainly in the
 * post too, because a demo that implies intelligence it doesn't have is
 * arguing for something it hasn't built. It doesn't weaken the point: a real
 * model raises the hit rate without giving the surface a floor, which is the
 * thing being demonstrated.
 */

type Shape = {
  rotate: number;
  size: number;
  radius: number;
  hue: number;
  light: number;
};

const INITIAL: Shape = { rotate: 0, size: 62, radius: 16, hue: 214, light: 52 };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** The panel's hue row. Six inks, and the slider covers everything between. */
const HUES = [
  { name: "blue", h: 214 },
  { name: "teal", h: 172 },
  { name: "green", h: 142 },
  { name: "amber", h: 38 },
  { name: "red", h: 8 },
  { name: "violet", h: 274 },
];

const COLORS: Record<string, number> = {
  ...Object.fromEntries(HUES.map((c) => [c.name, c.h])),
  orange: 28,
  yellow: 48,
  cyan: 190,
  indigo: 250,
  purple: 274,
  pink: 330,
  magenta: 322,
};

type Verb = {
  /** What the box understood. Named in the status line. */
  label: string;
  /** Composite verbs move more than one control from a single word. */
  intent?: boolean;
  apply: (s: Shape, n?: number) => Shape;
};

/**
 * The box's vocabulary.
 *
 * Ordered, and matched in order: `rotate 90` has to beat the bare `rotate`
 * that would otherwise swallow it. Numbers are captured where an absolute
 * value makes sense, so the box can be exact — being vague is a property of
 * the phrasing, not of the surface.
 */
const VERBS: [RegExp, Verb][] = [
  [
    /^(?:reset|start over|undo it all)$/,
    { label: "reset", apply: () => INITIAL },
  ],
  [
    /^(?:rotate|turn|spin)(?:\s+it)?(?:\s+to|\s+by)?\s+(-?\d+)\s*(?:deg|degrees)?$/,
    { label: "rotate", apply: (s, n) => ({ ...s, rotate: n ?? s.rotate }) },
  ],
  [
    /^(?:size|scale)(?:\s+it)?(?:\s+to)?\s+(\d+)$/,
    { label: "size", apply: (s, n) => ({ ...s, size: clamp(n ?? s.size, 30, 100) }) },
  ],
  [
    /^(?:radius|corner|corners)(?:\s+to)?\s+(\d+)$/,
    { label: "radius", apply: (s, n) => ({ ...s, radius: clamp(n ?? s.radius, 0, 50) }) },
  ],
  [
    /^(?:rotate|turn|spin)(?:\s+it)?$/,
    { label: "rotate", apply: (s) => ({ ...s, rotate: s.rotate + 45 }) },
  ],
  [
    /^(?:bigger|larger|grow|scale up)$/,
    { label: "bigger", apply: (s) => ({ ...s, size: clamp(s.size + 12, 30, 100) }) },
  ],
  [
    /^(?:smaller|tinier|shrink|scale down)$/,
    { label: "smaller", apply: (s) => ({ ...s, size: clamp(s.size - 12, 30, 100) }) },
  ],
  [
    /^(?:rounder|round|roundify)$/,
    { label: "rounder", apply: (s) => ({ ...s, radius: clamp(s.radius + 12, 0, 50) }) },
  ],
  [
    /^(?:sharper|sharp|squarer|square)$/,
    { label: "sharper", apply: (s) => ({ ...s, radius: clamp(s.radius - 12, 0, 50) }) },
  ],
  [
    /^(?:darker|dark|deeper)$/,
    { label: "darker", apply: (s) => ({ ...s, light: clamp(s.light - 14, 18, 86) }) },
  ],
  // Ambiguous on purpose, and resolved toward the literal reading — "lighter"
  // is a lightness word before it is a weight word. The post says so; the
  // ambiguity is a property of the input, not a bug in the parser.
  [
    /^(?:lighter|brighter|light|pale|paler)$/,
    { label: "lighter", apply: (s) => ({ ...s, light: clamp(s.light + 14, 18, 86) }) },
  ],
  [
    /^(?:heavier|heavy|weightier|denser|make it feel heavier)$/,
    {
      label: "heavier",
      intent: true,
      apply: (s) => ({
        ...s,
        light: clamp(s.light - 16, 18, 86),
        size: clamp(s.size + 10, 30, 100),
        radius: clamp(s.radius - 10, 0, 50),
      }),
    },
  ],
  [
    /^(?:softer|soft|gentler|friendlier)$/,
    {
      label: "softer",
      intent: true,
      apply: (s) => ({
        ...s,
        light: clamp(s.light + 10, 18, 86),
        radius: clamp(s.radius + 14, 0, 50),
        size: clamp(s.size - 6, 30, 100),
      }),
    },
  ],
  [
    /^(?:calmer|calm|quieter|subtler)$/,
    {
      label: "calmer",
      intent: true,
      apply: (s) => ({
        ...s,
        light: clamp(s.light + 8, 18, 86),
        radius: clamp(s.radius + 10, 0, 50),
        rotate: 0,
      }),
    },
  ],
  [
    /^(?:louder|angrier|meaner|aggressive|more aggressive)$/,
    {
      label: "louder",
      intent: true,
      apply: (s) => ({
        ...s,
        light: clamp(s.light - 12, 18, 86),
        radius: clamp(s.radius - 14, 0, 50),
        size: clamp(s.size + 8, 30, 100),
      }),
    },
  ],
];

type Parsed = { next: Shape; labels: string[]; intent: boolean };

/**
 * Applies one line to the shape.
 *
 * Clauses are split on "and" and commas and applied left to right, which is
 * the other thing the panel structurally cannot do: four sliders are four
 * gestures, and this is one.
 *
 * Returns null if any clause is unrecognised — a partial hit reads as a
 * success from the stage, and pretending an instruction landed when half of
 * it didn't is the failure the post is about.
 */
function parse(input: string, from: Shape): Parsed | null {
  const clauses = input
    .toLowerCase()
    .trim()
    .replace(/[.!]+$/, "")
    .split(/\s*(?:,|\band\b|\bthen\b)\s*/)
    .map((c) => c.replace(/^(?:make it|make|set it|set|it|please)\s+/, "").trim())
    .filter(Boolean);

  if (clauses.length === 0) return null;

  let shape = from;
  const labels: string[] = [];
  let intent = false;

  for (const clause of clauses) {
    const color = COLORS[clause] ?? COLORS[clause.replace(/^(?:go|turn)\s+/, "")];
    if (color !== undefined) {
      shape = { ...shape, hue: color };
      labels.push(clause);
      continue;
    }

    const hit = VERBS.find(([re]) => re.test(clause));
    if (!hit) return null;

    const [re, verb] = hit;
    const captured = re.exec(clause)?.[1];
    shape = verb.apply(shape, captured ? Number(captured) : undefined);
    labels.push(verb.label);
    intent = intent || Boolean(verb.intent);
  }

  return { next: shape, labels, intent };
}

/** Matches the inline-code chip the MDX map gives prose, which this is outside of. */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-foreground/[0.06] px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-wide text-muted">
        {label}
        <span className="tabular-nums">
          {Math.round(value)}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 accent-foreground"
      />
    </label>
  );
}

type Last =
  | { via: "none" }
  | { via: "panel" }
  | { via: "box"; labels: string[]; intent: boolean }
  | { via: "miss"; input: string };

const SUGGESTIONS = ["rotate 30", "make it heavier", "darker and rounder", "calmer"];

export function SurfaceDemo() {
  const [shape, setShape] = useState<Shape>(INITIAL);
  const [input, setInput] = useState("");
  const [last, setLast] = useState<Last>({ via: "none" });
  const [misses, setMisses] = useState(0);

  const set = (patch: Partial<Shape>) => {
    setShape((s) => ({ ...s, ...patch }));
    setLast({ via: "panel" });
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const result = parse(text, shape);
    if (!result) {
      setLast({ via: "miss", input: text });
      setMisses((n) => n + 1);
      return;
    }
    setShape(result.next);
    setLast({ via: "box", labels: result.labels, intent: result.intent });
    setInput("");
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-2xl shadow-ring">
      {/*
        The object. One of it, so neither driver can be accused of owning it.

        Sized in px off `size` rather than as a percentage of this box: at a
        percentage it hit a max-width somewhere around a third of the slider's
        travel and stopped moving, which quietly made the panel's size control
        a no-op over most of its range — the one thing this demo cannot afford,
        since the argument rests on the panel being complete. The stage is tall
        enough for the largest square's diagonal (180 × √2 ≈ 255px) so a
        rotation never clips against the frame either.
      */}
      <div className="flex h-72 items-center justify-center overflow-hidden bg-foreground/[0.03]">
        <div
          className="shrink-0 transition-all duration-500 ease-out"
          style={{
            width: `${(shape.size / 100) * 180}px`,
            height: `${(shape.size / 100) * 180}px`,
            borderRadius: `${shape.radius}%`,
            transform: `rotate(${shape.rotate}deg)`,
            backgroundColor: `hsl(${shape.hue} 45% ${shape.light}%)`,
          }}
        />
      </div>

      <div className="grid border-t border-line sm:grid-cols-2">
        {/* Everything it can do, drawn. */}
        <section className="space-y-3 border-b border-line p-4 sm:border-b-0 sm:border-r">
          <h3 className="font-mono text-[10px] uppercase tracking-wide text-foreground">
            control panel
          </h3>

          <Slider
            label="rotate"
            value={shape.rotate}
            min={0}
            max={360}
            suffix="°"
            onChange={(n) => set({ rotate: n })}
          />
          <Slider
            label="size"
            value={shape.size}
            min={30}
            max={100}
            suffix=""
            onChange={(n) => set({ size: n })}
          />
          <Slider
            label="radius"
            value={shape.radius}
            min={0}
            max={50}
            suffix="%"
            onChange={(n) => set({ radius: n })}
          />
          <Slider
            label="shade"
            value={shape.light}
            min={18}
            max={86}
            suffix=""
            onChange={(n) => set({ light: n })}
          />

          <div>
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
              fill
            </span>
            <div className="mt-1.5 flex gap-1.5">
              {HUES.map((c) => (
                <button
                  key={c.name}
                  aria-label={c.name}
                  onClick={() => set({ hue: c.h })}
                  style={{ backgroundColor: `hsl(${c.h} 45% 52%)` }}
                  className={`h-5 w-5 rounded-full transition-transform duration-150 hover:scale-110 ${
                    shape.hue === c.h ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Nothing it can do, drawn. */}
        <section className="flex flex-col p-4">
          <h3 className="font-mono text-[10px] uppercase tracking-wide text-foreground">
            text box
          </h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="say what you want"
              aria-label="Instruction"
              className="min-w-0 flex-1 rounded-lg bg-foreground/[0.04] px-3 py-2 text-sm outline-none placeholder:text-muted focus:bg-foreground/[0.07]"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg px-3 py-2 text-xs text-muted shadow-ring transition-colors duration-150 hover:text-foreground"
            >
              send
            </button>
          </form>

          {/*
            The chips are not a convenience. Every chat product ships something
            like them, and each one is the same admission: the box had no
            floor, so a small control panel got bolted back on beside it. Left
            in because arguing against them while hiding them would be cheap.
          */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full bg-foreground/[0.05] px-2.5 py-1 font-mono text-[10px] text-muted transition-colors duration-150 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>

          <p className="mt-auto pt-3 font-mono text-[10px] text-muted">
            {misses > 0
              ? `${misses} instruction${misses === 1 ? "" : "s"} went nowhere`
              : "no vocabulary is printed anywhere"}
          </p>
        </section>
      </div>

      <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">
        {last.via === "none" && (
          <>
            Same object, two ways in. Both can reach every state it has — the
            panel is complete, not crippled. Drive it from each side and watch
            where they stop being the same thing.
          </>
        )}
        {last.via === "panel" && (
          <>
            <span className="text-foreground">
              Every move this panel can make is on screen.
            </span>{" "}
            That is the entire language. There is no fifth slider you could
            have guessed at, and no phrasing that unlocks one.
          </>
        )}
        {last.via === "box" && last.intent && (
          <>
            <span className="text-foreground">
              One word moved three controls at once.
            </span>{" "}
            There is no <Code>{last.labels.join(" + ")}</Code> control, and
            there couldn&apos;t have been — someone would have had to think of
            it first, name it, and find room for it.
          </>
        )}
        {last.via === "box" && !last.intent && (
          <>
            The box did it{last.labels.length > 1 ? ", all of it in one go" : ""}.
            Nothing on screen told you <Code>{last.labels.join(", ")}</Code>{" "}
            would work.
          </>
        )}
        {last.via === "miss" && (
          <>
            <span className="text-foreground">
              &ldquo;{last.input}&rdquo; did nothing.
            </span>{" "}
            Nothing on screen told you it wouldn&apos;t — that&apos;s the
            floor, and you find it by falling through it. The panel has no
            equivalent failure: you cannot ask it for something it doesn&apos;t
            have.
          </>
        )}
      </p>
    </div>
  );
}
