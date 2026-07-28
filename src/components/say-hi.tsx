"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { profile } from "@/lib/data";
import { duration, ease, springSnappy } from "@/lib/motion";

const fieldClass =
  "w-full rounded-xl border border-line bg-surface/50 px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors duration-150 placeholder:text-muted/70 focus:border-foreground/25 focus:bg-surface/80";

/**
 * The contents of the "what's up" card. Rendered inside the dock surface once
 * it has expanded — no backend, submitting hands the message to the visitor's
 * mail client.
 */
export function SayHiForm({ onClose }: { onClose: () => void }) {
  const still = useReducedMotion();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus once the surface has finished expanding, so the browser doesn't
    // scroll or repaint mid-morph.
    const focusTimer = setTimeout(() => firstFieldRef.current?.focus(), 320);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const subject = name ? `Hey Erik — ${name}` : "Hey Erik";
    const body = email
      ? `${message}\n\n— ${name || "someone"} (${email})`
      : message;
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    setSent(true);
    setTimeout(onClose, 1600);
  }

  return (
    <div className="select-text p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[26px] font-medium leading-tight tracking-[-0.02em] text-foreground">
          What&rsquo;s up?
        </h2>
        <motion.button
          type="button"
          onClick={onClose}
          aria-label="Close"
          whileHover={still ? undefined : { scale: 1.08 }}
          whileTap={still ? undefined : { scale: 0.9 }}
          transition={springSnappy}
          className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
            <path
              d="m6 6 12 12M18 6 6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
            />
          </svg>
        </motion.button>
      </div>

      <p className="mt-2 text-sm font-light leading-relaxed text-muted">
        Work, an idea, a band I should be listening to — all equally welcome.
        It lands in my inbox and I actually read it.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            ref={firstFieldRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            aria-label="Your name"
            autoComplete="name"
            className={fieldClass}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Your email"
            aria-label="Your email"
            autoComplete="email"
            className={fieldClass}
          />
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          placeholder="hey erik, i have a stupid idea and a budget"
          aria-label="Message"
          className={`${fieldClass} resize-none`}
        />

        <motion.button
          type="submit"
          whileHover={still ? undefined : { scale: 1.01 }}
          whileTap={still ? undefined : { scale: 0.985 }}
          transition={springSnappy}
          className="mt-1 overflow-hidden rounded-xl bg-foreground px-4 py-3 text-[15px] font-medium text-background transition-opacity duration-150 hover:opacity-90 disabled:opacity-70"
          disabled={sent}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={sent ? "sent" : "idle"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: duration.fast, ease }}
              className="block"
            >
              {sent ? "Opening your mail app…" : "Send it"}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </form>

      <p className="mt-4 text-xs font-light text-muted">
        No newsletter, no funnel, no &ldquo;quick sync&rdquo;. Just me, on the
        other end.
      </p>
    </div>
  );
}
