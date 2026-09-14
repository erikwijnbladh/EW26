/** A tiny SVG keeps the dithered sphere without a permanent WebGL renderer. */
const dots = Array.from({ length: 49 }, (_, i) => {
  const x = (i % 7) * 1.6 + 1.2;
  const y = Math.floor(i / 7) * 1.6 + 1.2;
  const distance = Math.hypot(x - 6, y - 6);
  return distance <= 5.3 ? { x, y, radius: 0.35 + 0.32 * (x / 12) } : null;
}).filter((dot) => dot !== null);

export function DitherDot() {
  return (
    <svg viewBox="0 0 12 12" className="h-full w-full text-foreground" aria-hidden="true" focusable="false">
      {dots.map(({ x, y, radius }) => <circle key={`${x}-${y}`} cx={x} cy={y} r={radius} fill="currentColor" />)}
    </svg>
  );
}
