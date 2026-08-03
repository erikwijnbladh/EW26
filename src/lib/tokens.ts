/**
 * The tokens the whole site is drawn from.
 *
 * Every one of these is a CSS custom property set on `:root`, and every rule in
 * `globals.css` derives from them — nothing hard-codes a radius, a size or a
 * step of spacing. That's the point: the panel edits this object, the page
 * re-renders underneath it, and the blast radius of a single value is the thing
 * you're looking at rather than something you have to be told about.
 *
 * Keep this list short. A knob that only moves one element teaches nothing; a
 * knob that moves forty is the demo. If a token can't visibly change the shape
 * of the page, it doesn't belong here.
 */

export type Token = {
  /** CSS custom property, minus the leading dashes. */
  key: string;
  /** How it reads in the panel's source view. */
  label: string;
  min: number;
  max: number;
  step: number;
  /** Appended in the source view and when writing the property. */
  unit: string;
  value: number;
  /** Shown when the row is focused — what the visitor is about to move. */
  affects: string;
};

/**
 * Pointer travel, in pixels, that moves a token across its whole range.
 *
 * One constant rather than a per-token sensitivity: every row then answers the
 * hand identically, so `radius` and `tracking` feel like the same control even
 * though one spans 28 integers and the other spans 0.06 of an em. Tuning them
 * individually is how you get a panel where one number flies past its range in
 * a twitch and the next won't move at all.
 */
export const TRAVEL = 260;

export const TOKENS: Token[] = [
  {
    key: "radius",
    label: "radius",
    min: 0,
    max: 28,
    step: 1,
    unit: "px",
    value: 4,
    affects: "every surface, thumbnail and field on the page",
  },
  {
    key: "density",
    label: "density",
    min: 0.7,
    max: 1.6,
    step: 0.05,
    unit: "",
    value: 1,
    affects: "every gap, pad and rhythm step",
  },
  {
    key: "scale",
    label: "scale",
    min: 0.85,
    max: 1.35,
    step: 0.01,
    unit: "",
    value: 1,
    affects: "the whole type ramp, from the name down to the labels",
  },
  {
    key: "weight",
    label: "weight",
    min: 300,
    max: 700,
    step: 100,
    unit: "",
    value: 500,
    affects: "display type",
  },
  {
    key: "tracking",
    label: "tracking",
    min: -0.05,
    max: 0.01,
    step: 0.005,
    unit: "em",
    value: -0.03,
    affects: "letter-spacing on everything set large",
  },
  {
    key: "rule",
    label: "rule",
    min: 0,
    max: 1,
    step: 0.05,
    unit: "",
    value: 0.14,
    affects: "the hairlines that hold the grid together",
  },
  {
    key: "contrast",
    label: "contrast",
    min: 0.55,
    max: 1,
    step: 0.01,
    unit: "",
    value: 1,
    affects: "how far the ink sits from the paper",
  },
];

/** The default state, keyed for the panel and for `reset`. */
export const DEFAULTS: Record<string, number> = Object.fromEntries(
  TOKENS.map((token) => [token.key, token.value]),
);

/** What actually goes on the element, for one token. */
export function cssValue(token: Token, value: number): string {
  // `weight` is a bare number to CSS, and `density`/`scale`/`rule`/`contrast`
  // are multipliers other rules do arithmetic against — only the ones carrying
  // a real unit get one appended.
  return token.unit ? `${round(value, token.step)}${token.unit}` : String(round(value, token.step));
}

/** Steps smaller than 1 leave float noise on the value; trim to the step. */
export function round(value: number, step: number): number {
  const places = step >= 1 ? 0 : String(step).split(".")[1]?.length ?? 2;
  return Number(value.toFixed(places));
}

/** Clamp to range and snap to the step, so scrubbing can't leave a stray float. */
export function snap(token: Token, value: number): number {
  const clamped = Math.min(token.max, Math.max(token.min, value));
  const stepped = Math.round((clamped - token.min) / token.step) * token.step + token.min;
  return round(Math.min(token.max, Math.max(token.min, stepped)), token.step);
}

/** Write the whole set onto the document. */
export function applyTokens(values: Record<string, number>) {
  const root = document.documentElement;
  for (const token of TOKENS) {
    const value = values[token.key] ?? token.value;
    root.style.setProperty(`--${token.key}`, cssValue(token, value));
  }
}

export const STORAGE_KEY = "ew:tokens";
