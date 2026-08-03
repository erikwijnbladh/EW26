"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  DEFAULTS,
  STORAGE_KEY,
  TOKENS,
  TRAVEL,
  applyTokens,
  cssValue,
  snap,
  type Token,
} from "@/lib/tokens";
import { duration, ease } from "@/lib/motion";

/**
 * The contents of the cog card, rendered inside the dock surface once it has
 * expanded — same shell, same morph and same timing as the "what's up" card,
 * so the bar behaves identically whichever tab opened it.
 *
 * Every row here is a real CSS custom property that Tailwind's own scales are
 * built on (see `globals.css`), which is why moving one repaints the whole
 * site rather than the card it lives in. Numbers are scrubbed rather than
 * typed: dragging is how you find out what a token does, a text field assumes
 * you already know.
 */
export function LookPanel({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState<Record<string, number>>(DEFAULTS);

  // Derived rather than stored — "has anything moved" is a question `values`
  // already answers, and a second state for it is a second thing to keep true.
  const touched = TOKENS.some((token) => values[token.key] !== token.value);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // A one-shot read of an external store into state on mount. The pre-paint
  // script in `layout.tsx` has already put these on the document, so this is
  // the card catching up to the page rather than the page waiting on the card.
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
    <div className="w-[min(22rem,calc(100vw-4rem))] select-text p-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[26px] font-medium leading-tight tracking-[-0.02em] text-foreground">
          The look
        </h2>
        <button
          type="button"
          onClick={reset}
          disabled={!touched}
          className="text-xs text-muted transition-opacity duration-150 hover:text-foreground disabled:opacity-35"
        >
          reset
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-1">
        {TOKENS.map((token) => (
          <Row
            key={token.key}
            token={token}
            value={values[token.key]}
            onChange={(next) => set(token, next)}
          />
        ))}
      </div>

      <p className="mt-4 text-xs font-light text-muted">
        Drag a number. Every one of these is a variable the whole site is built
        on — nothing here is a preview.
      </p>
    </div>
  );
}

/**
 * One token: label, scrubbable value, and a hairline that fills with its
 * position in range.
 *
 * `role="slider"` rather than an `input[type=range]` — the value has to sit
 * inline beside its label, and a range input can't be made to do that without
 * a fight. Everything a slider owes is here instead: the aria value trio,
 * arrow keys, Home/End, and a focus ring.
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
  const still = useReducedMotion();
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
    // Travel is measured across the token's whole range, so a full sweep is
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

  const progress = (value - token.min) / (token.max - token.min);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] text-muted">{token.label}</span>
        <span
          role="slider"
          tabIndex={0}
          aria-label={`${token.label} — ${token.affects}`}
          aria-valuenow={value}
          aria-valuemin={token.min}
          aria-valuemax={token.max}
          aria-valuetext={cssValue(token, value)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className="touch-none select-none rounded-md px-1.5 py-0.5 font-mono text-xs tabular-nums text-foreground transition-colors duration-150 hover:bg-surface"
          style={{ cursor: "ew-resize" }}
        >
          {cssValue(token, value)}
        </span>
      </div>

      {/* The track is the row's own baseline rather than a separate control,
          so seven of these read as a list of values and not as a mixing desk. */}
      <div className="mt-1 h-px w-full bg-line">
        <motion.div
          className="h-px bg-foreground/40"
          initial={false}
          animate={{ scaleX: progress }}
          style={{ originX: 0, width: "100%" }}
          transition={
            still || live ? { duration: 0 } : { duration: duration.fast, ease }
          }
        />
      </div>

      <AnimatePresence>
        {live && (
          <motion.p
            initial={still ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={still ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: duration.fast, ease }}
            className="overflow-hidden text-xs font-light text-muted"
          >
            <span className="mt-1 block">{token.affects}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
