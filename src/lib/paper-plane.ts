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

/**
 * Lucide's own glyphs — `file-text`, `mail` and `send` — inlined rather than
 * imported, which is how every other icon on this site is carried.
 *
 * They're drawn in Lucide's native 24-unit space and placed into a 34-unit box
 * by the transforms below, so the paths stay byte-identical to the originals
 * and anything about where they sit is a transform rather than an edit.
 */
const LUCIDE = {
  /** file-text */
  letter: [
    "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
    "M14 2v4a2 2 0 0 0 2 2h4",
    "M10 9H8",
    "M16 13H8",
    "M16 17H8",
  ],
  /**
   * mail, with its rect written out as a path — `pathLength` is what the
   * draw-on maths normalises against, and it is only dependable on paths.
   */
  envelope: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  flap: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",
  /** send */
  plane:
    "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
  crease: "m21.854 2.147-10.94 10.939",
} as const;

/**
 * The box is 34 units for a 24-unit glyph, and the envelope sits at the bottom
 * of it. The spare third at the top is the letter's room: centred, there was
 * nowhere for it to be before it went in, and the one moment the sequence
 * exists to show happened off the top of the icon.
 */
const BOX = 34;
const ENVELOPE_AT = "translate(5 12)";
const LETTER_AT = "translate(9.6 1) scale(0.62)";
/**
 * Lucide's `send` points up and to the right, and the flight rotates by the
 * curve's own tangent — which assumes a nose along +x. The 45° is what makes
 * those two agree; without it the plane flies permanently sideways.
 */
const PLANE_AT = `rotate(45 ${BOX / 2} ${BOX / 2}) translate(5 5)`;

/** How far the letter travels: clear of the envelope, to well inside it. */
const LETTER_FROM = 0;
const LETTER_TO = 17;

/** The sequence, in milliseconds from the start. */
const HAND_OVER = 180; //  card dissolves, envelope and letter draw themselves
const POST_FROM = 330; //  a beat to read the letter before it moves
const POST = 720; //       the letter goes in
const SEAL = 940; //       the flap draws across it
const FOLDED = 1340; //    envelope gives way to the plane
const FLIGHT_MS = 1750;

/** The plane's size relative to the icon box, once folded. */
const FOLD_SCALE = 0.6;

/** Stroke weight in real pixels, held steady whatever size the icon is drawn at. */
const INK = 2.75;

const SVG_NS = "http://www.w3.org/2000/svg";

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** Progress through one stage of the timeline. */
const stage = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

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

/**
 * One Lucide stroke, able to draw itself on.
 *
 * `pathLength="1"` normalises the dash maths so it doesn't matter how long the
 * path actually is — the same dash offset means "one third drawn" on a
 * twenty-unit rectangle and on a two-unit tick.
 *
 * `fill` is the answer to these reading as transparent: outlined shapes let the
 * page straight through, and an envelope you can read the page through is a
 * drawing of an envelope rather than a thing. Filled, it occludes what it
 * passes over, which is what makes it an object.
 */
function stroke(d: string, ink: number, filled = false) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", d);
  // Set as a style rather than a presentation attribute: `var()` is only
  // substituted in the CSS cascade, and an attribute holding it is simply
  // invalid — which reads as the default fill, black.
  if (filled) path.style.fill = "var(--background)";
  else path.setAttribute("fill", "none");
  path.setAttribute("fill-opacity", "0");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", String(ink));
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("pathLength", "1");
  path.setAttribute("stroke-dasharray", "1");
  path.setAttribute("stroke-dashoffset", "1");
  return path;
}

/** How much of a stroke is drawn, and how solid the shape behind it is. */
function drawn(path: SVGPathElement, k: number) {
  path.setAttribute("stroke-dashoffset", String(1 - k));
  // Once it is all there, stop dashing it. A closed path drawn as a single
  // full-length dash still gets caps where the dash begins and ends, which
  // leaves a visible nick in the envelope's top-left corner.
  path.setAttribute("stroke-dasharray", k > 0.999 ? "none" : "1");
  // Behind the leading edge of the stroke, so the shape fills in as it is
  // drawn rather than appearing whole under a half-finished outline.
  path.setAttribute("fill-opacity", String(clamp01(k * 1.6 - 0.6)));
  // A stroke retracted to nothing still paints its round caps, which leaves a
  // dot behind at each end. Taking the opacity with it is what actually clears
  // the shape off the screen.
  path.setAttribute("opacity", String(clamp01(k * 12)));
}

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
  const size = Math.min(Math.max(Math.min(rect.width, rect.height) * 0.86, 150), 300);
  const left = rect.left + (rect.width - size) / 2;
  const top = rect.top + (rect.height - size) / 2;

  const flier = document.createElement("div");
  flier.setAttribute("aria-hidden", "true");
  flier.inert = true;
  flier.style.cssText =
    `position:fixed;left:${left}px;top:${top}px;width:${size}px;height:${size}px;` +
    `z-index:60;pointer-events:none;transform-origin:50% 50%;` +
    // The fill is the page's own colour, so without a shadow an opaque shape
    // over the page reads as a hole punched in it rather than something
    // sitting above it. Only the transform animates, so the filtered layer is
    // rasterised once and moved.
    `filter:drop-shadow(0 3px 10px rgb(0 0 0 / 0.13));` +
    `will-change:transform,opacity;transform:${tf({})}`;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${BOX} ${BOX}`);
  svg.style.cssText = "width:100%;height:100%;overflow:visible";
  // Inherits the card's own ink rather than naming a colour, so it stays right
  // in both themes.
  svg.style.color = getComputedStyle(card).color;

  // Lucide draws at stroke-width 2 in a 24-unit box, which is a 24px icon. Held
  // to that ratio a 300px envelope would carry a 25px outline; this keeps the
  // line the same weight it is everywhere else on the page, whatever the size.
  const ink = (INK * BOX) / size;

  const group = (transform: string, ...kids: SVGElement[]) => {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("transform", transform);
    g.append(...kids);
    return g;
  };

  const letterInk = LUCIDE.letter.map((d, i) => stroke(d, ink / 0.62, i === 0));
  const letter = group(LETTER_AT, ...letterInk);
  // Its own group, so the descent is a transform on top of the placement
  // rather than something that has to be recomputed against it.
  const posting = group("translate(0 0)", letter);

  const envelopeInk = stroke(LUCIDE.envelope, ink, true);
  const flapInk = stroke(LUCIDE.flap, ink);
  const envelope = group(ENVELOPE_AT, envelopeInk, flapInk);

  const planeInk = stroke(LUCIDE.plane, ink, true);
  const creaseInk = stroke(LUCIDE.crease, ink);
  const plane = group(PLANE_AT, planeInk, creaseInk);

  // The letter first, so the filled envelope simply covers it as it goes in —
  // no clip path needed, and the occlusion is the real thing rather than a
  // stand-in for it.
  svg.append(posting, envelope, plane);
  flier.append(svg);
  document.body.append(flier);

  const handOver = card.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: HAND_OVER,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    fill: "forwards",
  });

  /**
   * The whole pre-flight sequence, as one function of time.
   *
   * The envelope and the plane are two different Lucide glyphs, so this is a
   * retract and a redraw rather than a point-for-point morph — the way the bin
   * becomes a shredder and the envelope becomes a tick elsewhere on the site.
   * The plane starts drawing before the envelope has finished leaving, so
   * there is never a frame with nothing in it.
   */
  const paint = (t: number) => {
    const drawing = easeOut(stage(t, 0, HAND_OVER));
    const posted = easeInOut(stage(t, POST_FROM, POST));
    const sealing = easeOut(stage(t, POST, SEAL));
    const leaving = easeInOut(stage(t, SEAL, SEAL + (FOLDED - SEAL) * 0.55));
    const arriving = easeOut(stage(t, SEAL + (FOLDED - SEAL) * 0.3, FOLDED));

    drawn(envelopeInk, drawing * (1 - leaving));
    drawn(flapInk, sealing * (1 - leaving));
    letterInk.forEach((path) => drawn(path, drawing));

    posting.setAttribute(
      "transform",
      `translate(0 ${lerp(LETTER_FROM, LETTER_TO, posted)})`,
    );
    // Gone once it is in. The envelope's fill hides it long before this, so the
    // fade itself is never seen — but without it the letter reappears out of
    // the envelope's middle the moment the envelope starts dissolving.
    const swallowed = smoothstep(clamp01((posted - 0.7) / 0.3));
    posting.setAttribute("opacity", String(drawing * (1 - swallowed)));

    drawn(planeInk, arriving);
    drawn(creaseInk, arriving);

    flier.style.transform = tf({ scale: lerp(1, FOLD_SCALE, arriving) });
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
