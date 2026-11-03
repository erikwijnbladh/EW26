/**
 * A postage stamp, used as a section mark.
 *
 * Swedish stamps put the country and the value on the face, so these do too —
 * "SVERIGE" along the foot and the section number where the price would go.
 * The perforated edge is a mask, not an image, so the stamp sits on whatever
 * is behind it.
 */

const MOTIFS = {
  // Three crowns, as on the stamps and the City Hall tower.
  crowns: (
    <g fill="currentColor">
      {[[-9, 0], [9, 0], [0, 12]].map(([x, y]) => (
        <path
          key={`${x}${y}`}
          transform={`translate(${x} ${y - 6})`}
          d="M-6 3 L-6 -3 L-3 0 L0 -5 L3 0 L6 -3 L6 3 Z"
        />
      ))}
    </g>
  ),
  sun: (
    <g fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
      <circle r={6} fill="currentColor" stroke="none" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={0} y1={-10} x2={0} y2={-15} transform={`rotate(${i * 30})`} />
      ))}
    </g>
  ),
  pine: (
    <g fill="currentColor">
      <path d="M0 -17 L8 -5 L4 -5 L11 5 L5 5 L13 14 L-13 14 L-5 5 L-11 5 L-4 -5 L-8 -5 Z" />
      <rect x={-1.6} y={14} width={3.2} height={4} />
    </g>
  ),
  flake: (
    <g stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" fill="none">
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 60})`}>
          <line x1={0} y1={0} x2={0} y2={-15} />
          <polyline points="-4,-12 0,-8 4,-12" />
        </g>
      ))}
    </g>
  ),
  wave: (
    <g stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" fill="none">
      {[-8, 0, 8].map((y) => (
        <path key={y} d={`M-14 ${y} q3.5 -4 7 0 t7 0 t7 0 t7 0`} />
      ))}
    </g>
  ),
} as const;

export type Motif = keyof typeof MOTIFS;

const TONES = {
  blue: "bg-[#1f4f8f] text-[#f5c542]",
  red: "bg-[#8c2a1c] text-[#f2d7b6]",
  green: "bg-[#1f5a44] text-[#d9eadb]",
  lingon: "bg-[#9b2340] text-[#ffd9e0]",
  sea: "bg-[#165e74] text-[#d4f1f6]",
} as const;

export type Tone = keyof typeof TONES;

export function Stamp({
  number,
  motif,
  tone,
  className = "",
}: {
  number: number;
  motif: Motif;
  tone: Tone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`stamp inline-block shrink-0 -rotate-3 p-[5px] transition-transform duration-300 group-hover:rotate-0 ${className}`}
    >
      <span className={`relative flex h-[58px] w-12 flex-col rounded-[2px] ${TONES[tone]}`}>
        <span className="absolute left-1 top-0.5 font-mono text-[9px] font-semibold leading-none">
          {number}
        </span>
        <svg viewBox="-20 -20 40 40" className="mx-auto mt-2.5 size-8">
          {MOTIFS[motif]}
        </svg>
        <span className="mt-auto pb-1 text-center font-mono text-[6px] font-semibold tracking-[0.2em]">
          SVERIGE
        </span>
      </span>
    </span>
  );
}

/** A section heading: the stamp, then the title beside it. */
export function SectionHead({
  number,
  motif,
  tone,
  title,
  aside,
}: {
  number: number;
  motif: Motif;
  tone: Tone;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="group mb-6 flex items-center gap-4">
      <Stamp number={number} motif={motif} tone={tone} />
      <h2 className="text-[15px] font-medium text-foreground">{title}</h2>
      {aside && <div className="ml-auto text-xs text-muted/70">{aside}</div>}
    </div>
  );
}
