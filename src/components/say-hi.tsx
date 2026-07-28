"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { profile } from "@/lib/data";

const fieldClass =
  "w-full rounded-xl border border-line bg-surface/50 px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-foreground/25 focus:bg-surface/80";

/**
 * The little "What's up?" form behind the dock's chat button. No backend —
 * submitting hands the message off to the visitor's mail client.
 */
export function SayHi({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => firstFieldRef.current?.focus());

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      setSent(false);
    };
  }, [open, onClose]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const subject = name ? `Hey Erik — ${name}` : "Hey Erik";
    const body = email ? `${message}\n\n— ${name || "someone"} (${email})` : message;
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    setSent(true);
    setTimeout(onClose, 1600);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/10 px-4 pb-28 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Say hi"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md select-text rounded-3xl bg-background p-6 shadow-ring sm:p-7"
          >
            <h2 className="text-[26px] font-medium leading-tight tracking-[-0.02em] text-foreground">
              What&rsquo;s up?
            </h2>
            <p className="mt-2 text-sm font-light leading-relaxed text-muted">
              Work, an idea, a band I should be listening to — all equally
              welcome. It lands in my inbox and I actually read it.
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
                placeholder="hey erik, the dots on your face are sick"
                aria-label="Message"
                className={`${fieldClass} resize-none`}
              />

              <button
                type="submit"
                className="mt-1 rounded-xl bg-foreground px-4 py-3 text-[15px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                disabled={sent}
              >
                {sent ? "Opening your mail app…" : "Send it"}
              </button>
            </form>

            <p className="mt-4 text-xs font-light text-muted">
              No newsletter, no funnel, no &ldquo;quick sync&rdquo;. Just me,
              on the other end.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
