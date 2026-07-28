"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { profile } from "@/lib/data";
import { duration, ease, springSnappy, springSoft } from "@/lib/motion";

/** Shared with the dock's chat button — the panel morphs out of it. */
export const SAY_HI_LAYOUT_ID = "say-hi-surface";

const fieldClass =
  "w-full rounded-xl border border-line bg-surface/50 px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-foreground/25 focus:bg-surface/80";

/**
 * The little "What's up?" form. It grows out of the dock's chat button and
 * sits directly above the bar. No backend — submitting hands the message off
 * to the visitor's mail client.
 */
export function SayHi({
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
  const [sent, setSent] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    // Wait for the morph to finish before pulling focus, so the panel doesn't
    // get scrolled into view mid-animation.
    const focusTimer = setTimeout(() => firstFieldRef.current?.focus(), 260);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      setSent(false);
    };
  }, [open, onClose]);

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
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast, ease }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm"
          />

          {/* Sits just above the dock, centred on it. */}
          <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 sm:bottom-32">
            <motion.div
              layoutId={still ? undefined : SAY_HI_LAYOUT_ID}
              role="dialog"
              aria-modal="true"
              aria-label="Say hi"
              initial={still ? { opacity: 0 } : undefined}
              animate={still ? { opacity: 1 } : undefined}
              exit={still ? { opacity: 0 } : undefined}
              transition={springSoft}
              style={{ borderRadius: 24 }}
              className="pointer-events-auto w-full max-w-md select-text bg-background p-6 shadow-ring sm:p-7"
            >
              {/* Fades in once the surface has finished growing, and uses
                  layout="position" so it never squishes during the morph. */}
              <motion.div
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.12 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
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
                  No newsletter, no funnel, no &ldquo;quick sync&rdquo;. Just
                  me, on the other end.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
