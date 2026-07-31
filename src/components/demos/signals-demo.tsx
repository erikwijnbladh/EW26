"use client";

import { useState } from "react";

/**
 * The argument, playable.
 *
 * One payload, two consumers. The inferring one sniffs for a `campaigns` array
 * to decide whether a row expands; the declaring one reads `has_nested_rows`
 * off the header and never looks at the data. Both are correct on the rows
 * they were written against — that's the point, and why the difference is
 * invisible until the producer moves.
 *
 * Shipping the keywords row is what separates them. It carries nested data
 * under a different key, so the sniffing consumer finds no `campaigns`, calls
 * it a leaf, and drops four children on the floor. No error, no fallback, no
 * way to tell from the output that anything is missing — which is the failure
 * mode the essay is about, and the reason this is a toy you poke rather than a
 * paragraph you take on faith.
 */

type Row = {
  label: string;
  detail: string;
  /** The producer's declaration. The declaring consumer reads only this. */
  has_nested_rows?: boolean;
  /** Nested data, under a key the sniffing consumer knows about. */
  campaigns?: string[];
  /** Nested data under a key it doesn't. Same meaning, different shape. */
  terms?: string[];
  shipped?: boolean;
};

const BASE: Row[] = [
  {
    label: "Campaigns with issues",
    detail: "4 campaigns",
    has_nested_rows: true,
    campaigns: [
      "Brand — Exact",
      "Generic — Broad",
      "Competitor — Phrase",
      "Retargeting — Display",
    ],
  },
  { label: "Account budget", detail: "under-spending 12%" },
  { label: "Conversion tracking", detail: "healthy" },
];

const SHIPPED: Row = {
  label: "Keywords with low quality score",
  detail: "4 keywords",
  has_nested_rows: true,
  terms: ["running shoes", "cheap trainers", "best sneakers 2026", "nike air"],
  shipped: true,
};

/**
 * Inline code, matching the chip the MDX map gives `code` in prose. This
 * component renders outside that map, so it doesn't inherit it — without this
 * the key names in the caption read as plain words, which is the one place
 * they mustn't.
 */
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-foreground/[0.06] px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  );
}

/** What the producer sent, whatever key it used. */
function nested(row: Row) {
  return row.campaigns ?? row.terms ?? [];
}

/** Sniffs the payload: an array under the key it knows means "expandable". */
function inferExpandable(row: Row) {
  return Array.isArray(row.campaigns) && row.campaigns.length > 0;
}

/** Reads the declaration and nothing else. */
function declaredExpandable(row: Row) {
  return row.has_nested_rows === true;
}

export function SignalsDemo() {
  const [mode, setMode] = useState<"infer" | "declare">("infer");
  const [shipped, setShipped] = useState(false);
  const [open, setOpen] = useState<string | null>(BASE[0].label);

  const rows = shipped ? [...BASE, SHIPPED] : BASE;
  const inferring = mode === "infer";
  const expandable = inferring ? inferExpandable : declaredExpandable;

  // Rows the producer says have children, that this consumer won't show.
  const lost = rows.filter((r) => r.has_nested_rows && !expandable(r));
  const lostChildren = lost.reduce((n, r) => n + nested(r).length, 0);

  return (
    <div className="not-prose my-8 overflow-hidden rounded-2xl shadow-ring">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div
          role="tablist"
          aria-label="Consumer strategy"
          className="flex gap-1 rounded-full bg-foreground/[0.06] p-1"
        >
          {(
            [
              ["infer", "Consumer infers"],
              ["declare", "Producer declares"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                mode === value
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShipped((s) => !s)}
          className="rounded-full px-3 py-1 text-xs text-muted shadow-ring transition-colors duration-150 hover:text-foreground"
        >
          {shipped ? "Revert the producer" : "Ship a new row type"}
        </button>
      </div>

      <ul className="divide-y divide-line">
        {rows.map((row) => {
          const canExpand = expandable(row);
          const isOpen = canExpand && open === row.label;
          const children = nested(row);

          return (
            <li key={row.label}>
              <button
                onClick={() => canExpand && setOpen(isOpen ? null : row.label)}
                aria-expanded={canExpand ? isOpen : undefined}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                  canExpand ? "hover:bg-foreground/[0.03]" : "cursor-default"
                }`}
              >
                <span
                  aria-hidden
                  className={`w-3 shrink-0 font-mono text-[10px] text-muted transition-transform duration-200 ${
                    isOpen ? "rotate-90" : ""
                  }`}
                >
                  {canExpand ? "›" : ""}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">
                    {row.label}
                  </span>
                  <span className="block text-xs text-muted">{row.detail}</span>
                </span>

                {row.shipped && (
                  <span className="shrink-0 rounded-full bg-foreground/[0.06] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                    new
                  </span>
                )}
              </button>

              {isOpen && (
                <ul className="pb-2">
                  {children.map((child) => (
                    <li
                      key={child}
                      className="px-4 py-1.5 pl-10 text-xs text-muted"
                    >
                      {child}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">
        {lostChildren > 0 ? (
          <>
            <span className="text-foreground">
              {lostChildren} rows the producer sent are not on screen.
            </span>{" "}
            The consumer looked for a <Code>campaigns</Code>{" "}
            array, didn&apos;t find one, and called it a leaf. Nothing threw.
            The output is a perfectly plausible table.
          </>
        ) : inferring ? (
          <>
            Both consumers agree here — inference is right about every row it
            was written against. Ship a new row type to separate them.
          </>
        ) : (
          <>
            The consumer read <Code>has_nested_rows</Code>{" "}
            and never opened the payload. It has no opinion about which key the
            children arrived under, so a new row type costs it nothing.
          </>
        )}
      </p>
    </div>
  );
}
