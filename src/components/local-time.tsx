"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/data";

/** Minutes a timezone is offset from UTC at a given instant (DST included). */
function offsetMinutes(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );

  return Math.round((asUTC - date.getTime()) / 60000);
}

function describeGap(date: Date) {
  const gap = -date.getTimezoneOffset() - offsetMinutes(profile.timezone, date);
  if (gap === 0) return "We're on the same clock.";

  const hours = Math.abs(gap) / 60;
  const rounded = Number.isInteger(hours) ? hours : hours.toFixed(1);
  const unit = hours === 1 ? "hour" : "hours";
  return `It looks like you're ${rounded} ${unit} ${
    gap > 0 ? "ahead of" : "behind"
  } me.`;
}

/**
 * "…where it's currently 15:32:04 — it looks like you're 1 hour behind me."
 * Renders a dashed placeholder until mounted, since the clock and the visitor's
 * offset only exist on the client.
 */
export function LocalTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    // First tick on the next frame rather than inline, so the placeholder
    // renders once and hydration has nothing to disagree with.
    const frame = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, []);

  const time = now
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: profile.timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now)
    : "--:--:--";

  return (
    <>
      I live in {profile.location}, where it&rsquo;s currently{" "}
      <span className="tabular-nums text-foreground">{time}</span>
      {now ? ` — ${describeGap(now)}` : "."}
    </>
  );
}
