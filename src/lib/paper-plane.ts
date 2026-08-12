"use client";

/**
 * Sending the contact form: the message goes into an envelope, the envelope
 * becomes a paper plane, and the plane leaves.
 *
 * Drawn, not clipped. An earlier version folded a clone of the card itself into
 * a plane-shaped `clip-path`, which was a neat trick and the wrong one — it read
 * as a div being cut into a shape rather than paper being folded. This is the
 * same vocabulary as every other icon here: one box, nothing unmounts, strokes
 * draw themselves on and retract off.
 *
 * The morph is real. The envelope and the plane are the same two paths with the
 * same point counts throughout — a six-point outline and a three-point inner
 * line — so the envelope's body becomes the plane's silhouette and its sealed
 * flap becomes the plane's centre crease. Nothing crossfades into anything.
 *
 * The flier is `fixed` and lives on the body, because the dock shell is
 * `overflow-hidden` with a 26px radius: anything animated inside it is cut off
 * at the first corner it reaches, and the whole point is to leave. It also frees
 * the real card to close behind the plane instead of waiting for it.
 */

type Point = [number, number];

/**
 * Everything below is in the icon's own 100-unit box.
 *
 * The two shapes share their structure so they can be interpolated directly,
 * and the correspondence is the fold: the envelope's right edge holds still and
 * becomes the nose, its left edge pinches into the notch between the tails, and
 * its corners pull in to the leading edges.
 */
/**
 * The envelope sits low in the box on purpose: the top third is the message's
 * room. Centred, there was nowhere for the sheet to be before it went in, and
 * the one moment the whole sequence exists to show — a letter going into an
 * envelope — happened almost entirely off the top of the icon.
 */
const ENVELOPE: Point[] = [
  [88, 68], // right edge  -> nose
  [88, 46], // top-right   -> leading top
  [12, 46], // top-left    -> tail top
  [12, 68], // left edge   -> notch
  [12, 90], // bottom-left -> tail bottom
  [88, 90], // bottom-right-> leading bottom
];

const PLANE: Point[] = [
  [96, 50],
  [52, 26],
  [8, 14],
  [40, 50],
  [8, 86],
  [52, 74],
];

/**
 * The flap: open, sealed, and the centre crease it finally becomes.
 *
 * One stroke doing three jobs, which is what sells the whole thing — it is
 * never redrawn, only moved. Sealing is its middle point sweeping down through
 * the envelope; folding is the same three points sliding out to the plane's
 * centre line. An envelope whose flap draws on at the end is a rectangle for
 * most of the sequence, and a rectangle is not an envelope.
 */
const FLAP_OPEN: Point[] = [
  [12, 46],
  [50, 18],
  [88, 46],
];

const FLAP_SEALED: Point[] = [
  [12, 46],
  [50, 74],
  [88, 46],
];

const CREASE: Point[] = [
  [8, 14],
  [40, 50],
  [96, 50],
];

/** The message itself, as a sheet that drops in — sitting clear above the envelope before it does. */
const SHEET = { x: 27, y: 2, w: 46, h: 36, r: 3 };
const SHEET_FROM = 0;
const SHEET_TO = 54;

/** Where the envelope swallows things — the front panel's top edge. */
const MOUTH = 46;

/** The sequence, in milliseconds from the start. */
const HAND_OVER = 180; //  card dissolves, envelope and letter draw themselves
const POST_FROM = 330; //  a beat to read the letter before it moves
const POST = 720; //       the sheet goes in
const SEAL = 960; //       the flap swings shut
const FOLDED = 1380; //    envelope becomes plane
const FLIGHT_MS = 1750;

/** The plane's size relative to the icon box, once folded. */
const FOLD_SCALE = 0.72;

const SVG_NS = "http://www.w3.org/2000/svg";

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** Progress through one stage of the timeline. */
const stage = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const between = (a: Point[], b: Point[], k: number): Point[] =>
  a.map(([x, y], i) => [lerp(x, b[i][0], k), lerp(y, b[i][1], k)]);

const line = (points: Point[], close = false) =>
  `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")}${close ? " Z" : ""}`;

type Frame = {
  x?: number;
  y?: number;
  rot?: number;
  bank?: number;
  scale?: number;
};

function tf({ x = 0, y = 0, rot = 0, bank = 0, scale = 1 }: Frame) {
  return (
    `perspective(900px) translate3d(${x}px, ${y}px, 0) ` +
    `rotate(${rot}deg) rotateX(${bank}deg) scale(${scale})`
  );
}

/**
 * The flight path, as a Catmull-Rom curve through control points.
 *
 * Held in unit space — one unit is "as far as there is room to go" — so the
 * same lap works on a phone and on a monitor. It is scaled at launch by the
 * room actually free between the icon and each edge, and capped, so a wide
 * screen gets a tidy lap rather than a trip to the far corner.
 */
const LAP: { x: number; y: number }[] = [
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
function spline(points: { x: number; y: number }[], per = 26) {
  const pad = [points[0], ...points, points[points.length - 1]];
  const out: { x: number; y: number }[] = [];

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
 * through 180° carries on turning instead of snapping the long way round. It is
 * blended out of level over the first sixth of the flight, because the plane is
 * lying flat when it launches and has to leave like it.
 */
function frames(path: { x: number; y: number }[], base: number): Keyframe[] {
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

    const level = smoothstep(clamp01(offset / 0.16));
    const turn =
      heading[Math.min(i + 1, heading.length - 1)] - heading[Math.max(i - 1, 0)];
    const bank = Math.max(-38, Math.min(38, turn * 2.2));

    out.push({
      offset,
      opacity: offset < 0.82 ? 1 : Math.max(0, 1 - (offset - 0.82) / 0.18),
      transform: tf({
        x: point.x,
        y: point.y,
        rot: heading[i] * level,
        bank: bank * level,
        // Climbing away, so it reads as getting further off rather than smaller.
        scale: base * (1 - 0.45 * offset),
      }),
    });
  });

  return out;
}

/** A stroke that can draw itself on. `pathLength` normalises it so the dash maths doesn't care how long the path actually is — which matters here, because these paths change shape as they draw. */
function stroke(width = 1.6) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", String(width));
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("pathLength", "1");
  path.setAttribute("stroke-dasharray", "1");
  return path;
}

const drawn = (path: SVGPathElement, k: number) =>
  path.setAttribute("stroke-dashoffset", String(1 - k));

/**
 * Fold `card`'s message into a paper plane and fly it away.
 *
 * Resolves once the plane has gone and the flier has been cleaned up. The card
 * is hidden for the duration and handed back untouched, so the caller can close
 * and reset it whenever it likes — the flight outlives it.
 */
export async function sendOff(card: HTMLElement): Promise<void> {
  const rect = card.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  // Big, as the whole point is that you can see it happen — but never wider
  // than the card it came out of.
  const size = Math.min(Math.max(Math.min(rect.width, rect.height) * 0.62, 120), 220);
  const left = rect.left + (rect.width - size) / 2;
  const top = rect.top + (rect.height - size) / 2;

  const flier = document.createElement("div");
  flier.setAttribute("aria-hidden", "true");
  flier.inert = true;
  flier.style.cssText =
    `position:fixed;left:${left}px;top:${top}px;width:${size}px;height:${size}px;` +
    `z-index:60;pointer-events:none;transform-origin:50% 50%;` +
    `will-change:transform,opacity;transform:${tf({})}`;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.style.cssText = "width:100%;height:100%;overflow:visible";
  // Inherits the card's own ink rather than naming a colour, so it stays right
  // in both themes.
  svg.style.color = getComputedStyle(card).color;

  // The sheet disappears behind the envelope's front as it goes in — clipped
  // at the mouth rather than faded, so it reads as going inside something.
  const clip = document.createElementNS(SVG_NS, "clipPath");
  const clipId = `plane-mouth-${Math.random().toString(36).slice(2, 9)}`;
  clip.setAttribute("id", clipId);
  const mouth = document.createElementNS(SVG_NS, "rect");
  mouth.setAttribute("x", "-60");
  mouth.setAttribute("y", "-120");
  mouth.setAttribute("width", "220");
  mouth.setAttribute("height", String(120 + MOUTH));
  clip.append(mouth);

  const defs = document.createElementNS(SVG_NS, "defs");
  defs.append(clip);

  const body = stroke();
  const flap = stroke();

  const post = document.createElementNS(SVG_NS, "g");
  post.setAttribute("clip-path", `url(#${clipId})`);

  const sheet = document.createElementNS(SVG_NS, "g");
  const paper = document.createElementNS(SVG_NS, "rect");
  paper.setAttribute("x", String(SHEET.x));
  paper.setAttribute("y", String(SHEET.y));
  paper.setAttribute("width", String(SHEET.w));
  paper.setAttribute("height", String(SHEET.h));
  paper.setAttribute("rx", String(SHEET.r));
  paper.setAttribute("fill", "none");
  paper.setAttribute("stroke", "currentColor");
  paper.setAttribute("stroke-width", "1.6");

  sheet.append(paper);
  // Ragged line lengths, so it reads as writing rather than a barcode.
  [0.74, 0.86, 0.52].forEach((width, i) => {
    const rule = document.createElementNS(SVG_NS, "line");
    const y = SHEET.y + 11 + i * 8;
    rule.setAttribute("x1", String(SHEET.x + 7));
    rule.setAttribute("x2", String(SHEET.x + 7 + (SHEET.w - 14) * width));
    rule.setAttribute("y1", String(y));
    rule.setAttribute("y2", String(y));
    rule.setAttribute("stroke", "currentColor");
    rule.setAttribute("stroke-width", "1.4");
    rule.setAttribute("stroke-linecap", "round");
    rule.setAttribute("opacity", "0.45");
    sheet.append(rule);
  });
  post.append(sheet);

  svg.append(defs, post, body, flap);
  flier.append(svg);
  document.body.append(flier);

  const handOver = card.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: HAND_OVER,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards",
  });

  /** The whole pre-flight sequence, as one function of time. */
  const paint = (t: number) => {
    const drawing = easeOut(stage(t, 0, HAND_OVER));
    const posting = easeInOut(stage(t, POST_FROM, POST));
    const sealing = easeOut(stage(t, POST, SEAL));
    const folding = easeInOut(stage(t, SEAL, FOLDED));

    const outline = folding > 0 ? between(ENVELOPE, PLANE, folding) : ENVELOPE;
    body.setAttribute("d", line(outline, true));
    drawn(body, drawing);

    // Open, then shut, then unfolded into the crease — one stroke, moved twice,
    // never redrawn.
    flap.setAttribute(
      "d",
      line(
        folding > 0
          ? between(FLAP_SEALED, CREASE, folding)
          : between(FLAP_OPEN, FLAP_SEALED, sealing),
      ),
    );
    drawn(flap, drawing);

    sheet.setAttribute(
      "transform",
      `translate(0 ${lerp(SHEET_FROM, SHEET_TO, posting)})`,
    );

    // Arrives with the envelope, and once it's a plane there is no sheet
    // outside it any more.
    post.setAttribute("opacity", String(drawing * (1 - folding)));
    flier.style.transform = tf({ scale: lerp(1, FOLD_SCALE, folding) });
  };

  paint(0);

  await new Promise<void>((resolve) => {
    const started = performance.now();
    const step = () => {
      const t = performance.now() - started;
      paint(Math.min(t, FOLDED));
      if (t < FOLDED) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });

  // Away. The lap is scaled to the room actually available, measured from the
  // icon's centre and capped, and the exit is in pixels because leaving the
  // screen is the one part that mustn't be clamped to fit it.
  const centreX = left + size / 2;
  const centreY = top + size / 2;
  const span = (size * FOLD_SCALE) / 2;

  const room = (free: number, cap: number) => Math.min(Math.max(60, free), cap);
  const roomX = room(Math.min(centreX, window.innerWidth - centreX) - span - 8, 240);
  const roomY = room(centreY - span - 8, 280);

  const path = spline([
    ...LAP.map((u) => ({ x: u.x * roomX, y: u.y * roomY })),
    { x: roomX * 1.35, y: -(centreY + span * 2) },
  ]);

  await flier.animate(frames(path, FOLD_SCALE), {
    duration: FLIGHT_MS,
    easing: "cubic-bezier(0.4, 0, 0.7, 1)",
    fill: "forwards",
  }).finished;

  flier.remove();
  handOver.cancel();
  card.style.opacity = "";
}
