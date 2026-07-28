"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { actions, type Action } from "@/components/actions";

/**
 * ⌘K palette. Controlled by the dock, which owns the open state and the
 * keyboard shortcut.
 */
export function CommandMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = actions.filter((a) =>
    `${a.label} ${a.hint}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  // Focus the input once the dialog is mounted; clear the query on the way out.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      setQuery("");
      setActive(0);
      setFlash(null);
    };
  }, [open]);

  const select = useCallback(
    (action: Action) => {
      action.run();
      if (!action.done) {
        onClose();
        return;
      }
      setFlash(action.id);
      setTimeout(onClose, 550);
    },
    [onClose],
  );

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) =>
        results.length ? (i - 1 + results.length) % results.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const action = results[active];
      if (action) select(action);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-foreground/10 px-5 pt-[18vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-background shadow-ring"
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Type a command…"
              aria-label="Search commands"
              className="w-full border-b border-line bg-transparent px-4 py-3.5 text-[15px] font-light text-foreground outline-none placeholder:text-muted"
            />

            <ul className="p-1.5">
              {results.map((action, i) => (
                <li key={action.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => select(action)}
                    className={`flex w-full items-baseline gap-3 rounded-xl px-2.5 py-2.5 text-left text-[15px] transition-colors ${
                      i === active ? "bg-surface" : ""
                    }`}
                  >
                    <span className="text-foreground">{action.label}</span>
                    <span className="ml-auto truncate text-xs text-muted">
                      {flash === action.id ? action.done : action.hint}
                    </span>
                  </button>
                </li>
              ))}

              {results.length === 0 && (
                <li className="px-2.5 py-2.5 text-[15px] text-muted">
                  Nothing here.
                </li>
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
