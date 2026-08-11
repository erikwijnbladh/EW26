"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Contributions as ContributionsData } from "@/lib/github";
import { springSnappy } from "@/lib/motion";

/**
 * Ink, not green. The jump from "nothing" to "something" is deliberately the
 * biggest one — an empty day sits barely above the background, while a single
 * contribution is already unmistakably ink. The four active steps are then
 * spaced evenly so the busy end still separates.
 */
const LEVELS = [
  "bg-foreground/[0.06]",
  "bg-foreground/[0.34]",
  "bg-foreground/[0.52]",
  "bg-foreground/[0.7]",
  "bg-foreground/[0.88]",
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** A month label sits above the first column that starts a new month. */
function monthLabels(weeks: ContributionsData["weeks"]) {
  const labels: { index: number; label: string }[] = [];
  let previous = -1;

  weeks.forEach((week, index) => {
    const first = week.find((day) => day.date);
    if (!first) return;

    const month = Number(first.date.slice(5, 7)) - 1;
    if (month !== previous) {
      // Skip a label that would collide with the previous one.
      if (labels.length === 0 || index - labels[labels.length - 1].index >= 3) {
        labels.push({ index, label: MONTHS[month] });
      }
      previous = month;
    }
  });

  return labels;
}

/** "3 contributions on Sun, 3 Aug 2025" */
function describe(date: string, count: number) {
  const when = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const what =
    count === 0
      ? "No contributions"
      : `${count} contribution${count === 1 ? "" : "s"}`;

  return `${what} on ${when}`;
}

type Hovered = { x: number; y: number; text: string };

/** A year of GitHub activity, in the site's own greys. */
export function Contributions({ data }: { data: ContributionsData }) {
  const labels = monthLabels(data.weeks);
  const columns = data.weeks.length;
  const gridRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Hovered | null>(null);

  function show(event: React.MouseEvent<HTMLElement>, text: string) {
    const grid = gridRef.current?.getBoundingClientRect();
    if (!grid) return;

    const cell = event.currentTarget.getBoundingClientRect();
    setHovered({
      x: cell.left - grid.left + cell.width / 2,
      y: cell.top - grid.top,
      text,
    });
  }

  return (
    <section aria-label="GitHub activity">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs text-muted/70">
          GitHub activity
        </p>
        <p className="text-xs text-muted">
          {data.total.toLocaleString("en-US")} contributions
        </p>
      </div>

      <div className="mt-4">
        <div
          className="grid gap-[2px] text-[10px] text-muted/70"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          aria-hidden
        >
          {labels.map(({ index, label }) => (
            <span
              key={`${label}-${index}`}
              className="col-span-3 whitespace-nowrap"
              style={{ gridColumnStart: index + 1 }}
            >
              {label}
            </span>
          ))}
        </div>

        <div ref={gridRef} className="relative mt-1.5">
          <div
            className="grid grid-flow-col gap-[2px]"
            style={{
              gridTemplateRows: "repeat(7, minmax(0, 1fr))",
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
            onMouseLeave={() => setHovered(null)}
          >
            {data.weeks.map((week, w) =>
              week.map((day, d) =>
                day.level < 0 ? (
                  <span key={`${w}-${d}`} />
                ) : (
                  <span
                    key={`${w}-${d}`}
                    onMouseEnter={(e) =>
                      show(e, describe(day.date, day.count))
                    }
                    className={`aspect-square w-full rounded-[2px] ${
                      LEVELS[Math.min(day.level, 4)]
                    }`}
                  />
                ),
              ),
            )}
          </div>

          <AnimatePresence>
            {hovered && (
              <motion.span
                role="tooltip"
                initial={{ opacity: 0, y: 4, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.92 }}
                transition={springSnappy}
                style={{ left: hovered.x, top: hovered.y }}
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-xs text-background"
              >
                <span className="block -mt-px">{hovered.text}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted/70">
          <span>Less</span>
          {LEVELS.map((level) => (
            <span key={level} className={`size-2 rounded-[2px] ${level}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
