"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { profile, contacts } from "@/lib/data";

type Action = {
  id: string;
  label: string;
  hint: string;
  run: () => void | Promise<void>;
  /** Label shown briefly after running, instead of closing silently. */
  done?: string;
};

const github = contacts.find((c) => c.label === "github")?.href ?? "";
const linkedin = contacts.find((c) => c.label === "linkedin")?.href ?? "";

const actions: Action[] = [
  {
    id: "copy-email",
    label: "copy email",
    hint: profile.email,
    done: "copied",
    run: () => navigator.clipboard.writeText(profile.email),
  },
  {
    id: "github",
    label: "github",
    hint: "erikwijnbladh",
    run: () => {
      window.open(github, "_blank", "noopener,noreferrer");
    },
  },
  {
    id: "linkedin",
    label: "linkedin",
    hint: "erik-wijnbladh",
    run: () => {
      window.open(linkedin, "_blank", "noopener,noreferrer");
    },
  },
];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = actions.filter((a) =>
    `${a.label} ${a.hint}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const openMenu = useCallback(() => {
    setQuery("");
    setActive(0);
    setFlash(null);
    setOpen(true);
  }, []);

  // ⌘K / Ctrl+K toggles the menu from anywhere on the page.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((wasOpen) => {
          if (!wasOpen) {
            setQuery("");
            setActive(0);
            setFlash(null);
          }
          return !wasOpen;
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus the input once the dialog is mounted.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const select = useCallback(async (action: Action) => {
    await action.run();
    if (!action.done) {
      setOpen(false);
      return;
    }
    setFlash(action.id);
    setTimeout(() => setOpen(false), 550);
  }, []);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
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
      if (action) void select(action);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        className="font-mono text-xs lowercase text-muted transition-colors hover:text-foreground"
      >
        press <kbd className="font-mono">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] flex items-start justify-center bg-foreground/10 px-5 pt-[18vh] backdrop-blur-sm"
            onClick={() => setOpen(false)}
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
                placeholder="type a command…"
                aria-label="Search commands"
                className="w-full border-b border-line bg-transparent px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-muted"
              />

              <ul className="p-1.5">
                {results.map((action, i) => (
                  <li key={action.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => void select(action)}
                      className={`flex w-full items-baseline gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm ${
                        i === active ? "bg-surface" : ""
                      }`}
                    >
                      <span className="text-foreground">{action.label}</span>
                      <span className="ml-auto truncate font-mono text-xs text-muted">
                        {flash === action.id ? action.done : action.hint}
                      </span>
                    </button>
                  </li>
                ))}

                {results.length === 0 && (
                  <li className="px-2.5 py-2.5 text-sm text-muted">
                    nothing here
                  </li>
                )}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
