"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULTS,
  STORAGE_KEY,
  TOKENS,
  applyTokens,
  cssValue,
  snap,
  TRAVEL,
  type Token,
} from "@/lib/tokens";

/**
 * The site's own tokens, exposed and editable.
 *
 * This is the argument the rest of the page is making, made operable: the same
 * loop Pane exists for — change one value, watch everything downstream move at
 * once, with no save step — pointed at this site instead of a component
 * library. It reads as source because it is source: the values here are the
 * values `globals.css` draws from, and there is no second copy.
 *
 * Numbers are scrubbed rather than typed. Dragging a value is how you find out
 * what it does; a text field makes you already know. Arrow keys do the same job
 * for anyone not using a pointer, which is also why every row is a real
 * `slider` and not a div that happens to listen for drags.
 */
export function TokensPanel() {
  const [values, setValues] = useState<Record<string, number>>(DEFAULTS);
  const [open, setOpen] = useState(false);

  // Derived, not stored: "has anything moved" is a question `values` already
  // answers, and a second state for it is a second thing to keep in sync.
  const touched = TOKENS.some((token) => values[token.key] !== token.value);

  // A one-shot read of an external store (localStorage) into state on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Record<string, number>;
      const merged = { ...DEFAULTS };
      for (const token of TOKENS) {
        if (typeof parsed[token.key] === "number") {
          merged[token.key] = snap(token, parsed[token.key]);
        }
      }
      // The pre-paint script in `layout.tsx` has already put these values on
      // the document, so this is the panel catching up to the page rather than
      // the page waiting on the panel — nothing visibly re-renders, which is
      // the cascade the rule guards against.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(merged);
    } catch {
      // A corrupt entry is not worth a broken page.
    }
  }, []);

  useEffect(() => {
    applyTokens(values);
  }, [values]);

  const set = useCallback((token: Token, next: number) => {
    setValues((prev) => {
      const merged = { ...prev, [token.key]: snap(token, next) };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Private mode, quota, an extension. The page still works.
      }
      return merged;
    });
  }, []);

  const reset = useCallback(() => {
    setValues(DEFAULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // As above.
    }
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-controls="tokens-panel"
        className="fixed bottom-0 right-0 z-50 m-[var(--s3)] border border-[color:var(--line)] bg-[color:var(--paper)] px-[var(--s3)] py-[var(--s2)] transition-colors hover:bg-[color:var(--surface)]"
        style={{ borderRadius: "var(--radius)" }}
      >
        <span className="label" style={{ color: "var(--ink)" }}>
          {open ? "close" : "tokens.ts"}
        </span>
      </button>

      <aside
        id="tokens-panel"
        hidden={!open}
        aria-label="Design tokens"
        className="fixed bottom-0 right-0 z-40 m-[var(--s3)] w-[min(23rem,calc(100vw-2rem))] border border-[color:var(--line)] bg-[color:var(--paper)]"
        style={{
          borderRadius: "var(--radius)",
          marginBottom: "calc(var(--s6) + var(--s3))",
          boxShadow: "0 1px 2px hsl(225 8% 9% / 0.05), 0 12px 40px hsl(225 8% 9% / 0.09)",
        }}
      >
        <header className="flex items-center justify-between gap-[var(--s3)] border-b border-[color:var(--line)] px-[var(--s3)] py-[var(--s2)]">
          <span className="label">src/lib/tokens.ts</span>
          <button
            type="button"
            onClick={reset}
            disabled={!touched}
            className="label transition-opacity disabled:opacity-35"
            style={{ color: "var(--ink)" }}
          >
            reset
          </button>
        </header>

        <div
          className="px-[var(--s3)] py-[var(--s3)] font-[family-name:var(--mono)]"
          style={{ fontSize: "calc(11.5px * var(--scale))", lineHeight: 1.9 }}
        >
          <p className="dim m-0">export const tokens = {"{"}</p>
          <div className="stack">
            {TOKENS.map((token) => (
              <Row
                key={token.key}
                token={token}
                value={values[token.key]}
                onChange={(next) => set(token, next)}
              />
            ))}
          </div>
          <p className="dim m-0">{"}"}</p>
        </div>

        <footer className="border-t border-[color:var(--line)] px-[var(--s3)] py-[var(--s2)]">
          <p className="mono m-0" style={{ lineHeight: 1.5 }}>
            Drag a number. Everything on the page is drawn from these — same
            loop as Pane, pointed at the site itself.
          </p>
        </footer>
      </aside>
    </>
  );
}

/**
 * One token, rendered as a line of the object it actually is.
 *
 * The value carries `role="slider"` rather than being a styled `input[range]`:
 * it has to sit inline in a line of source, and a range input can't be made to
 * do that without fighting it. Everything a slider owes — the aria value trio,
 * arrow and Home/End keys, a focus ring — is here instead.
 */
function Row({
  token,
  value,
  onChange,
}: {
  token: Token;
  value: number;
  onChange: (next: number) => void;
}) {
  const scrub = useRef<{ id: number; x: number; from: number } | null>(null);
  const [live, setLive] = useState(false);

  function onPointerDown(event: React.PointerEvent<HTMLSpanElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    scrub.current = { id: event.pointerId, x: event.clientX, from: value };
    setLive(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLSpanElement>) {
    const active = scrub.current;
    if (!active || active.id !== event.pointerId) return;
    // Travel is measured against the token's whole range, so a full sweep is
    // one comfortable drag whatever the units happen to be.
    const span = token.max - token.min;
    onChange(active.from + ((event.clientX - active.x) / TRAVEL) * span);
  }

  function onPointerUp(event: React.PointerEvent<HTMLSpanElement>) {
    if (scrub.current?.id !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    scrub.current = null;
    setLive(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    const jump =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? token.step
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? -token.step
          : 0;

    if (jump) {
      event.preventDefault();
      onChange(value + jump * (event.shiftKey ? 10 : 1));
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      onChange(token.min);
    }
    if (event.key === "End") {
      event.preventDefault();
      onChange(token.max);
    }
  }

  const shown = cssValue(token, value);
  const progress = (value - token.min) / (token.max - token.min);

  return (
    <p className="m-0 flex items-baseline whitespace-nowrap">
      <span className="dim">&nbsp;&nbsp;{token.label}:&nbsp;</span>
      <span
        role="slider"
        tabIndex={0}
        aria-label={`${token.label} — ${token.affects}`}
        aria-valuenow={value}
        aria-valuemin={token.min}
        aria-valuemax={token.max}
        aria-valuetext={shown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="relative touch-none select-none px-[2px] tabular-nums"
        style={{
          color: "var(--ink)",
          // A ground that fills with the value — the row reads as a number and
          // as its own position in range at the same time, without a track
          // sitting outside the line and breaking the source illusion.
          backgroundImage: `linear-gradient(to right, var(--surface) ${progress * 100}%, transparent ${progress * 100}%)`,
          cursor: "ew-resize",
          outlineOffset: 1,
        }}
      >
        {shown}
      </span>
      <span className="dim">,</span>
      {live && (
        <span className="dim overflow-hidden text-ellipsis" aria-hidden>
          {`\u00a0// ${token.affects}`}
        </span>
      )}
    </p>
  );
}
