"use client";

/**
 * Sending the contact form: the card folds itself up and flies away.
 *
 * The message doesn't get a tick and a toast — the thing you wrote squashes
 * flat, folds into a paper plane and leaves. The confirmation *is* the
 * animation, which is why this is worth the machinery.
 *
 * Two structural decisions carry the whole effect:
 *
 * 1. The flier is a `fixed`-position clone appended to the body, not the card
 *    itself. The dock shell is `overflow-hidden` with a 26px radius — anything
 *    animated inside it is cut off at the first corner it reaches, and the
 *    whole point is to leave. Cloning also frees the real card to close behind
 *    the plane instead of waiting for it.
 *
 * 2. The silhouette is a six-point `clip-path` that never changes its point
 *    count, so the browser can interpolate it directly. The card's own box is
 *    what squashes — the plane's proportions come from a flat scale, not from
 *    the polygon — which keeps the clip-path animating over a shape that is
 *    already small by the time it starts.
 */

type Point = { x: number; y: number };

/**
 * The same six vertices, twice: an open sheet and a folded dart.
 *
 * The order is the correspondence, and it is the difference between a fold and
 * a scramble. The right edge holds still and becomes the nose; the top and
 * bottom corners pull in to the leading edges; the left edge pinches into the
 * notch between the tails.
 */
const OPEN: [number, number][] = [
  [100, 50], // nose        <- right edge, stays put
  [100, 0], //  leading top <- top-right corner
  [0, 0], //    tail top    <- top-left corner
  [0, 50], //   notch       <- left edge, pinches in
  [0, 100], //  tail bottom <- bottom-left corner
  [100, 100], // leading bottom
];

const DART: [number, number][] = [
  [100, 50],
  [52, 22],
  [0, 4],
  [34, 50],
  [0, 96],
  [52, 78],
];

const poly = (points: [number, number][]) =>
  `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;

/**
 * How flat the card gets.
 *
 * A paper dart is about twice as wide as it is tall, and the card is roughly
 * square — so the squash is what makes the silhouette plausible, and the
 * polygon only has to carve a plane out of a shape that is already the right
 * proportion. Folding a dart out of a square box instead gives a fat, stubby
 * thing no amount of creasing rescues.
 */
const SMUSHED = { x: 0.42, y: 0.18 };
const FOLDED = { x: 0.34, y: 0.15 };

const SMUSH_MS = 380;
const FOLD_MS = 460;
const FLIGHT_MS = 1750;

/** Expo-out and quint-in-out, matching `lib/motion`. */
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

const SVG_NS = "http://www.w3.org/2000/svg";

type Frame = {
  x?: number;
  y?: number;
  rot?: number;
  bank?: number;
  tilt?: number;
  sx?: number;
  sy?: number;
};

/**
 * `perspective` first so the tilts read as paper turning in space rather than a
 * flat shear, and `scale` last so it doesn't multiply the translation.
 */
function tf({ x = 0, y = 0, rot = 0, bank = 0, tilt = 0, sx = 1, sy = 1 }: Frame) {
  return (
    `perspective(900px) translate3d(${x}px, ${y}px, 0) ` +
    `rotate(${rot}deg) rotateX(${bank}deg) rotateY(${tilt}deg) scale(${sx}, ${sy})`
  );
}

/**
 * The flight path, as a Catmull-Rom curve through control points.
 *
 * Held in unit space — one unit is "as far as there is room to go" — so the
 * same lap works on a phone and on a monitor. It is scaled at launch by the
 * room actually free between the card and each edge, and capped, so a wide
 * screen gets a tidy lap rather than a trip to the far corner.
 */
const LAP: Point[] = [
  { x: 0, y: 0 },
  { x: 0.62, y: -0.32 },
  { x: 0.98, y: -0.86 },
  { x: 0.42, y: -1.18 },
  { x: -0.32, y: -0.98 },
  { x: -0.88, y: -0.52 },
  { x: -0.6, y: -0.06 },
  { x: 0.02, y: -0.2 },
  { x: 0.5, y: -0.6 },
];

/** Catmull-Rom through every control point, endpoints doubled so it starts and ends where it says. */
function spline(points: Point[], per = 26): Point[] {
  const pad = [points[0], ...points, points[points.length - 1]];
  const out: Point[] = [];

  for (let i = 0; i + 3 < pad.length; i++) {
    const [p0, p1, p2, p3] = [pad[i], pad[i + 1], pad[i + 2], pad[i + 3]];

    for (let s = 0; s < per; s++) {
      const t = s / per;
      const t2 = t * t;
      const t3 = t2 * t;

      out.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }

  out.push(points[points.length - 1]);
  return out;
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * Turn a sampled path into keyframes.
 *
 * Two things here are the difference between flying and juddering:
 *
 * Keyframes are placed by **arc length**, not by index. The sampler produces
 * points at even steps of the curve's parameter, and those are not evenly
 * spaced in distance — tight corners bunch them up. Spread evenly in time, the
 * plane would crawl through the corners and lurch down the straights.
 *
 * Heading is the curve's own **tangent**, unwrapped so a bank that passes
 * through 180° carries on turning instead of snapping the long way round. It's
 * blended out of level over the first sixth of the flight, because the plane
 * starts life as a card lying flat and has to leave like one.
 */
function frames(path: Point[], scale: { x: number; y: number }): Keyframe[] {
  const run = [0];
  for (let i = 1; i < path.length; i++) {
    run.push(run[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
  }
  const total = run[run.length - 1] || 1;

  let previous = 0;
  const heading = path.map((_, i) => {
    const ahead = path[Math.min(i + 1, path.length - 1)];
    const behind = path[Math.max(i - 1, 0)];
    let deg = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;

    while (deg - previous > 180) deg -= 360;
    while (previous - deg > 180) deg += 360;
    previous = deg;

    return deg;
  });

  const out: Keyframe[] = [];
  let last = -1;

  path.forEach((point, i) => {
    const offset = run[i] / total;
    // Equal offsets are illegal in a keyframe list, and a curve with a
    // stationary point produces them.
    if (offset <= last) return;
    last = offset;

    const level = smoothstep(Math.min(1, offset / 0.16));
    const turn =
      heading[Math.min(i + 1, heading.length - 1)] - heading[Math.max(i - 1, 0)];
    const bank = Math.max(-38, Math.min(38, turn * 2.2));
    // Climbing away, so it reads as getting further off rather than smaller.
    const away = 1 - 0.45 * offset;

    out.push({
      offset,
      opacity: offset < 0.82 ? 1 : Math.max(0, 1 - (offset - 0.82) / 0.18),
      transform: tf({
        x: point.x,
        y: point.y,
        rot: heading[i] * level,
        bank: bank * level,
        sx: scale.x * away,
        sy: scale.y * away,
      }),
    });
  });

  return out;
}

/** An overlay drawn in the flier's own box, so it distorts with the fold. */
function overlay(): { svg: SVGSVGElement; envelope: SVGGElement; plane: SVGGElement } {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  // The box is deliberately not square by the time these show, and the shapes
  // have to sit exactly on the clip-path — so they stretch with it, and only
  // the stroke width is held back from stretching with them.
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;overflow:visible;color:inherit";

  const draw = (d: string, fill = "none", opacity = "1") => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", fill);
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.25");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    path.setAttribute("opacity", opacity);
    return path;
  };

  const envelope = document.createElementNS(SVG_NS, "g");
  envelope.style.opacity = "0";
  envelope.append(
    draw("M1 1 H99 V99 H1 Z"),
    // The flap, which becomes the plane's centre crease — the one stroke both
    // shapes share, so the envelope reads as folding rather than being swapped.
    draw("M1 1 L50 52 L99 1"),
  );

  const plane = document.createElementNS(SVG_NS, "g");
  plane.style.opacity = "0";
  const dart = DART.map(([x, y]) => `${x} ${y}`).join(" L ");
  plane.append(
    draw(`M ${dart} Z`),
    // One shaded face. A dart only reads as folded if the two halves catch the
    // light differently; without this it is a flat arrow.
    draw("M100 50 L0 4 L34 50 Z", "currentColor", "0.1"),
  );

  svg.append(envelope, plane);
  return { svg, envelope, plane };
}

/**
 * Fold `card` into a paper plane and fly it away.
 *
 * Resolves when the plane has gone and the clone has been cleaned up. The card
 * itself is hidden for the duration and handed back untouched, so the caller
 * can close and reset it whenever it likes — the flight outlives it.
 */
export async function sendOff(card: HTMLElement): Promise<void> {
  const rect = card.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const flier = document.createElement("div");
  flier.setAttribute("aria-hidden", "true");
  flier.inert = true;
  flier.style.cssText =
    `position:fixed;left:${rect.left}px;top:${rect.top}px;` +
    `width:${rect.width}px;height:${rect.height}px;` +
    `z-index:60;pointer-events:none;transform-origin:50% 50%;` +
    `will-change:transform,clip-path,opacity;clip-path:${poly(OPEN)};` +
    `transform:${tf({})}`;

  const copy = card.cloneNode(true) as HTMLElement;
  // `cloneNode` copies the value *attribute*, not what anyone typed. Without
  // this the card folds up empty, which rather gives the game away.
  const written = card.querySelectorAll("input, textarea");
  copy.querySelectorAll("input, textarea").forEach((field, i) => {
    const source = written[i];
    if (source instanceof HTMLInputElement || source instanceof HTMLTextAreaElement) {
      (field as HTMLInputElement | HTMLTextAreaElement).value = source.value;
    }
    field.removeAttribute("id");
  });
  copy.style.width = "100%";
  copy.style.height = "100%";

  const { svg, envelope, plane } = overlay();
  flier.append(copy, svg);
  document.body.append(flier);

  card.style.opacity = "0";

  const run = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) =>
    el.animate(keyframes, { fill: "forwards", ...options }).finished;

  // Squashed flat. The card's own box does this, so everything inside it —
  // the heading, the fields, whatever got typed — compresses together.
  await Promise.all([
    run(
      flier,
      [
        { transform: tf({}) },
        { transform: tf({ sx: SMUSHED.x, sy: SMUSHED.y, tilt: -8 }) },
      ],
      { duration: SMUSH_MS, easing: EASE_IN_OUT },
    ),
    run(envelope, [{ opacity: 0 }, { opacity: 1 }], {
      duration: SMUSH_MS * 0.7,
      delay: SMUSH_MS * 0.3,
      easing: EASE,
    }),
  ]);

  // Folded. The silhouette becomes a dart while the sheet turns through the
  // fold, and the crisp outline arrives over the back half of it — early
  // enough to explain the shape, late enough not to precede it.
  await Promise.all([
    run(
      flier,
      [
        { clipPath: poly(OPEN), transform: tf({ sx: SMUSHED.x, sy: SMUSHED.y, tilt: -8 }) },
        {
          offset: 0.55,
          clipPath: poly(
            OPEN.map((p, i) => [
              p[0] + (DART[i][0] - p[0]) * 0.55,
              p[1] + (DART[i][1] - p[1]) * 0.55,
            ]) as [number, number][],
          ),
          transform: tf({ sx: 0.38, sy: 0.16, tilt: 26, bank: -14 }),
        },
        { clipPath: poly(DART), transform: tf({ sx: FOLDED.x, sy: FOLDED.y }) },
      ],
      { duration: FOLD_MS, easing: EASE_IN_OUT },
    ),
    run(envelope, [{ opacity: 1 }, { opacity: 0 }], {
      duration: FOLD_MS * 0.45,
      easing: EASE,
    }),
    run(plane, [{ opacity: 0 }, { opacity: 1 }], {
      duration: FOLD_MS * 0.5,
      delay: FOLD_MS * 0.5,
      easing: EASE,
    }),
  ]);

  // Away. The lap is scaled to the room actually available, measured from the
  // card's centre and capped, and the exit is in pixels because leaving the
  // screen is the one part that mustn't be clamped to fit it.
  const centreX = rect.left + rect.width / 2;
  const centreY = rect.top + rect.height / 2;
  const planeW = rect.width * FOLDED.x;
  const planeH = rect.height * FOLDED.y;

  const room = (free: number, cap: number) =>
    Math.min(Math.max(60, free), cap);
  const roomX = room(
    Math.min(centreX, window.innerWidth - centreX) - planeW / 2 - 8,
    240,
  );
  const roomY = room(centreY - planeH / 2 - 8, 280);

  const path = spline([
    ...LAP.map((u) => ({ x: u.x * roomX, y: u.y * roomY })),
    { x: roomX * 1.35, y: -(centreY + planeH * 1.5) },
  ]);

  await run(flier, frames(path, FOLDED), {
    duration: FLIGHT_MS,
    easing: "cubic-bezier(0.4, 0, 0.7, 1)",
  });

  flier.remove();
  card.style.opacity = "";
}
