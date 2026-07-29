export type ContributionDay = {
  date: string;
  /** GitHub's own 0–4 bucketing. */
  level: number;
  /** Contributions that day. */
  count: number;
};

export type Contributions = {
  total: number;
  /** Columns of seven days, Sunday first — the shape the grid renders. */
  weeks: ContributionDay[][];
};

/**
 * Pulls the calendar out of GitHub's public contributions fragment. Attributes
 * are read per-tag rather than with one big pattern, because their order isn't
 * stable across GitHub's markup changes.
 */
export function parseContributions(html: string): Contributions | null {
  // Counts live in separate <tool-tip for="cell-id"> elements, not on the cell.
  const counts = new Map<string, number>();
  for (const match of html.matchAll(
    /<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g,
  )) {
    const text = match[2].trim();
    counts.set(
      match[1],
      Number(/^([\d,]+)\s+contribution/.exec(text)?.[1]?.replace(/,/g, "") ?? 0),
    );
  }

  const days: ContributionDay[] = [];

  for (const match of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = match[0];
    const date = /data-date="(\d{4}-\d{2}-\d{2})"/.exec(tag)?.[1];
    if (!date) continue;

    const id = /\bid="([^"]+)"/.exec(tag)?.[1];
    days.push({
      date,
      level: Number(/data-level="(\d+)"/.exec(tag)?.[1] ?? 0),
      count: (id && counts.get(id)) || 0,
    });
  }

  if (days.length === 0) return null;

  days.sort((a, b) => a.date.localeCompare(b.date));

  const headline = /([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i.exec(
    html,
  );
  let total = headline ? Number(headline[1].replace(/,/g, "")) : 0;

  // Fall back to summing the per-day counts if the headline moved.
  if (!total) {
    total = days.reduce((sum, day) => sum + day.count, 0);
  }

  // Pad the first column so weekday rows line up.
  const weeks: ContributionDay[][] = [];
  let column: ContributionDay[] = [];
  const firstWeekday = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  for (let i = 0; i < firstWeekday; i++) {
    column.push({ date: "", level: -1, count: 0 });
  }

  for (const day of days) {
    column.push(day);
    if (column.length === 7) {
      weeks.push(column);
      column = [];
    }
  }
  if (column.length) weeks.push(column);

  return { total, weeks };
}

/**
 * A year of contributions for `user`. Public endpoint, no token. Returns null
 * on any failure — the graph is decoration and must never break the page.
 */
export async function getContributions(
  user: string,
): Promise<Contributions | null> {
  try {
    const res = await fetch(
      `https://github.com/users/${encodeURIComponent(user)}/contributions`,
      {
        headers: { "x-requested-with": "XMLHttpRequest" },
        // Refresh once a day; the page stays static in between.
        next: { revalidate: 86400 },
      },
    );

    if (!res.ok) return null;
    return parseContributions(await res.text());
  } catch {
    return null;
  }
}
