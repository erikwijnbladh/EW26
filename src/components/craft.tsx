import { cn } from "@/lib/utils";

/**
 * One piece on the workbench: a surface to play with and a caption under it.
 *
 * The caption is deliberately outside the surface. Inside, it would be part of
 * the toy and compete with it; underneath, it reads like the label on a
 * specimen — number, name, and one line on where the data comes from.
 */
export function Craft({
  id,
  index,
  title,
  note,
  className,
  surfaceClassName,
  children,
}: {
  id: string;
  index: number;
  title: string;
  note: string;
  className?: string;
  surfaceClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <figure id={id} className={cn("min-w-0 scroll-mt-28", className)}>
      <div className={cn("craft-surface relative overflow-hidden", surfaceClassName)}>
        {children}
      </div>
      <figcaption className="mt-3 flex items-baseline gap-3 px-1 text-xs">
        <span className="font-mono tabular-nums text-muted/60">
          {String(index).padStart(2, "0")}
        </span>
        <span className="font-medium text-foreground">{title}</span>
        <span className="ml-auto truncate text-muted/70">{note}</span>
      </figcaption>
    </figure>
  );
}

/** The table of contents in the intro column, keyed to the same ids. */
export const CRAFTS = [
  { id: "turntable", title: "Turntable", note: "Live from Spotify" },
  { id: "dial", title: "Career dial", note: "Turn it" },
  { id: "deck", title: "Elsewhere", note: "Away from the screen" },
  { id: "clock", title: "Stockholm", note: "Local time, and yours" },
  { id: "commits", title: "Commits", note: "Last six months" },
] as const;
