"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { profile } from "@/lib/data";
import { duration, ease, springSnappy } from "@/lib/motion";

const fieldClass =
  "w-full rounded-xl border border-line bg-surface/50 px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors duration-150 placeholder:text-muted/70 focus:border-foreground/25 focus:bg-surface/80";

/** Where the form is in the send: nothing yet, in flight, failed, or done. */
type Status = "idle" | "sending" | "error" | "sent";

/** What the button says in each state. */
const LABEL: Record<Status, string> = {
  idle: "Send it",
  sending: "Sending…",
  error: "Try again",
  sent: "Sent!",
};

/**
 * The contents of the "what's up" card. Rendered inside the dock surface once
 * it has expanded.
 *
 * Posts to `/api/contact`, which sends the message through Resend. It used to
 * build a `mailto:` and hand off to the visitor's mail client, which only works
 * for people who have one configured — on a shared desktop it opens something
 * nobody has signed into, and the message is lost without ever looking lost.
 *
 * The card holds itself open on failure. Closing on submit was fine when
 * handing off to a mail client, because the draft survived in the client; now
 * the message only exists in these fields, and dismissing the card over a failed
 * send would throw away something someone just wrote.
 */
export function SayHiForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const still = useReducedMotion();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Gated on `open`, not on mount: the dock keeps both cards mounted so it can
  // cross-fade between them, so this component is alive from page load and an
  // ungated focus would take the caret off the page before anyone clicked
  // anything. The dock also measures a hidden copy of this card, which would
  // otherwise install a second Escape handler.
  useEffect(() => {
    if (!open) return;

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
  }, [open, onClose]);

  // Only once the send has actually succeeded, and long enough to read the
  // confirmation. Cleared on unmount so a card closed by hand mid-wait doesn't
  // leave a timer pointed at a gone component.
  useEffect(() => {
    if (status !== "sent") return;
    const timer = setTimeout(onClose, 1600);
    return () => clearTimeout(timer);
  }, [status, onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // A second press while the first is in flight would send twice.
    if (status === "sending" || status === "sent") return;

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        // The route sends a reason worth showing; a proxy failing in front of
        // it won't, so there's a fallback that doesn't say "undefined".
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;

        setError(body?.error ?? "Couldn't send that. Try again in a moment.");
        setStatus("error");
        return;
      }

      setStatus("sent");
    } catch {
      // Offline, DNS, a connection cut mid-request.
      setError("Couldn't reach the server. Check your connection.");
      setStatus("error");
    }
  }

  const busy = status === "sending" || status === "sent";

  return (
    // Deliberately the same measure as the ask card. The dock morphs its shell
    // between the two, and matching widths leave only the height to travel —
    // one axis of movement to read instead of two.
    <div className="w-[min(23rem,calc(100vw-4rem))] select-text p-4">
      <h2 className="text-[26px] font-medium leading-tight tracking-[-0.02em] text-foreground">
        What&rsquo;s up?
      </h2>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            ref={firstFieldRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            aria-label="Your name"
            autoComplete="name"
            maxLength={100}
            disabled={busy}
            className={fieldClass}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="Your email"
            // Required now that the reply goes to this address rather than
            // being composed in the visitor's own client — without it there is
            // no way to answer.
            aria-label="Your email (required)"
            autoComplete="email"
            maxLength={200}
            disabled={busy}
            className={fieldClass}
          />
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          placeholder="Hey Erik, I have a stupid idea and a budget"
          aria-label="Message"
          maxLength={5000}
          disabled={busy}
          className={`${fieldClass} resize-none`}
        />

        <motion.button
          type="submit"
          whileHover={still || busy ? undefined : { scale: 1.01 }}
          whileTap={still || busy ? undefined : { scale: 0.985 }}
          transition={springSnappy}
          className="mt-1 overflow-hidden rounded-xl bg-foreground px-4 py-3 text-[15px] font-medium text-background transition-opacity duration-150 hover:opacity-90 disabled:opacity-70"
          disabled={busy}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={status}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: duration.fast, ease }}
              className="block"
            >
              {LABEL[status]}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </form>

      {/*
        Error copy swaps into the footer's reserved space instead of adding a
        new row. The dock measures a separate hidden copy of this form, so live
        state cannot safely change its height after the shell has opened.
      */}
      <div className="relative mt-4 min-h-12 text-xs font-light">
        <AnimatePresence mode="wait" initial={false}>
          {status === "error" && error ? (
            <motion.p
              key="error"
              role="alert"
              initial={still ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={still ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: duration.fast, ease }}
              className="absolute inset-x-0 top-0 leading-relaxed text-foreground/80"
            >
              {error} Or email{" "}
              <a
                href={`mailto:${profile.email}`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                {profile.email}
              </a>{" "}
              directly.
            </motion.p>
          ) : (
            <motion.p
              key="note"
              initial={still ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={still ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: duration.fast, ease }}
              className="absolute inset-x-0 top-0 text-muted"
            >
              Please don't try to sell me anything...
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
