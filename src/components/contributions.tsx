import type { Contributions } from "@/lib/github";

/** Ink, not green — five steps of the foreground colour. */
const LEVELS = [
  "bg-foreground/[0.07]",
  "bg-foreground/[0.22]",
  "bg-foreground/[0.4]",
  "bg-foreground/[0.62]",
  "bg-foreground/[0.85]",
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
function monthLabels(weeks: Contributions["weeks"]) {
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

/** A year of GitHub activity, in the site's own greys. */
export function Contributions({ data }: { data: Contributions }) {
  const labels = monthLabels(data.weeks);
  const columns = data.weeks.length;

  return (
    <section aria-label="GitHub activity">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.08em] text-muted/70">
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

        <div
          className="mt-1.5 grid grid-flow-col gap-[2px]"
          style={{
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {data.weeks.map((week, w) =>
            week.map((day, d) =>
              day.level < 0 ? (
                <span key={`${w}-${d}`} />
              ) : (
                <span
                  key={`${w}-${d}`}
                  title={day.date}
                  className={`aspect-square w-full rounded-[2px] ${
                    LEVELS[Math.min(day.level, 4)]
                  }`}
                />
              ),
            ),
          )}
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
