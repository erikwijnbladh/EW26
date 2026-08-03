/**
 * The knobs behind the cog in the dock.
 *
 * Each one is a CSS custom property on `:root` that `globals.css` feeds into
 * Tailwind's own theme namespace — `--spacing`, `--radius-*`, `--text-*` — so
 * every `rounded-2xl`, `mt-12` and `text-base` already in the components
 * answers to them without a single class being rewritten. That's what makes
 * this a look control rather than a slider that moves one box.
 *
 * Keep the list short and keep it global. A token that can't visibly change
 * the whole page isn't worth a row.
 */

export type Token = {
  /** CSS custom property, minus the leading dashes. */
  key: string;
  /** How it reads in the panel. */
  label: string;
  min: number;
  max: number;
  step: number;
  /** Appended when the property is written. */
  unit: string;
  value: number;
  /** Shown under the row while it's being moved. */
  affects: string;
};

/**
 * Pointer travel, in pixels, that moves a token across its whole range.
 *
 * One constant rather than a per-token sensitivity, so every row answers the
 * hand identically whether it spans 24 pixels or 0.4 of a multiplier. Tuning
 * them separately is how you end up with one knob that twitches past its range
 * and another that won't budge.
 */
export const TRAVEL = 240;

export const TOKENS: Token[] = [
  {
    key: "radius",
    label: "radius",
    min: 0,
    max: 32,
    step: 1,
    unit: "px",
    value: 16,
    affects: "every card, field, thumbnail and the dock itself",
  },
  {
    key: "space",
    label: "spacing",
    min: 0.7,
    max: 1.4,
    step: 0.05,
    unit: "",
    value: 1,
    affects: "every margin, gap and pad on the page",
  },
  {
    key: "text",
    label: "text",
    min: 0.85,
    max: 1.25,
    step: 0.01,
    unit: "",
    value: 1,
    affects: "the whole type ramp",
  },
  {
    key: "warmth",
    label: "warmth",
    min: 0,
    max: 1,
    step: 0.02,
    unit: "",
    value: 1,
    affects: "the paper — warm stone through to cool grey",
  },
  {
    key: "contrast",
    label: "contrast",
    min: 0.5,
    max: 1,
    step: 0.01,
    unit: "",
    value: 1,
    affects: "how far the ink sits from the paper",
  },
  {
    key: "rule",
    label: "rule",
    min: 0,
    max: 0.4,
    step: 0.01,
    unit: "",
    value: 0.12,
    affects: "every hairline and every ring",
  },
  {
    key: "grain",
    label: "grain",
    min: 0,
    max: 0.12,
    step: 0.005,
    unit: "",
    value: 0.04,
    affects: "the film grain over the whole page",
  },
];

/** The defaults, keyed — also what `reset` restores. */
export const DEFAULTS: Record<string, number> = Object.fromEntries(
  TOKENS.map((token) => [token.key, token.value]),
);

/** Steps below 1 leave float noise behind; trim to the step's precision. */
export function round(value: number, step: number): number {
  const places = step >= 1 ? 0 : (String(step).split(".")[1]?.length ?? 2);
  return Number(value.toFixed(places));
}

/** What actually goes on the element. */
export function cssValue(token: Token, value: number): string {
  const trimmed = round(value, token.step);
  return token.unit ? `${trimmed}${token.unit}` : String(trimmed);
}

/** Clamp into range and snap to the step, so a scrub can't leave a stray float. */
export function snap(token: Token, value: number): number {
  const clamped = Math.min(token.max, Math.max(token.min, value));
  const stepped =
    Math.round((clamped - token.min) / token.step) * token.step + token.min;
  return round(Math.min(token.max, Math.max(token.min, stepped)), token.step);
}

/** Write the whole set onto the document. */
export function applyTokens(values: Record<string, number>) {
  const root = document.documentElement;
  for (const token of TOKENS) {
    root.style.setProperty(
      `--${token.key}`,
      cssValue(token, values[token.key] ?? token.value),
    );
  }
}

export const STORAGE_KEY = "ew:look";
