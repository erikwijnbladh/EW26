"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { profile } from "@/lib/data";
import { duration, ease, springSnappy, springSoft } from "@/lib/motion";

const fieldClass =
  "w-full rounded-xl border border-line bg-surface/50 px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-foreground/25 focus:bg-surface/80";

/**
 * The little "What's up?" form behind the dock's chat button. No backend —
 * submitting hands the message off to the visitor's mail client.
 */
export function SayHi({ open, onClose }: { open: boolean; onClose: () => void }) {
  const still = useReducedMotion();
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
          transition={{ duration: duration.fast, ease }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/10 px-4 pb-28 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Say hi"
            initial={
              still
                ? { opacity: 0 }
                : { opacity: 0, y: 16, scale: 0.96, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={
              still
                ? { opacity: 0, transition: { duration: duration.fast } }
                : {
                    opacity: 0,
                    y: 8,
                    scale: 0.98,
                    filter: "blur(4px)",
                    // Leaving is quicker than arriving.
                    transition: { duration: 0.18, ease },
                  }
            }
            transition={springSoft}
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
              No newsletter, no funnel, no &ldquo;quick sync&rdquo;. Just me,
              on the other end.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
