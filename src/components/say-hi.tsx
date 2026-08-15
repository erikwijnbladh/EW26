"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { profile } from "@/lib/data";
import { drawOff, drawOn, duration, ease, instant } from "@/lib/motion";

const inputClass =
  "mt-1 w-full bg-transparent text-[15px] leading-tight text-foreground outline-none placeholder:text-muted/60";

/** Where the form is in the send: nothing yet, in flight, failed, or done. */
type Status = "idle" | "sending" | "error" | "sent";

/** What the button is offering to do, for anyone who can't see the icon. */
const LABEL: Record<Status, string> = {
  idle: "Send message",
  sending: "Sending…",
  error: "Try again",
  sent: "Sent",
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * Sending a message: the arrow leaves, and comes back as a tick.
 *
 * The same arrow the chat's composer sends with, deliberately — the two cards
 * now end in the same square button with the same glyph sitting still in it, so
 * switching tabs doesn't change the button at all. It is the one thing on either
 * card that doesn't have to morph, because it was never different.
 *
 * Built the way every icon here is: one box, nothing unmounts, states reached by
 * drawing strokes on and retracting them. The arrow flies off and returns on a
 * loop while the request is in flight, then leaves for good as the tick draws
 * in — so the wait and the confirmation are one movement rather than two icons
 * taking turns.
 */
function SendIcon({ status, still }: { status: Status; still: boolean }) {
  const sending = status === "sending";
  const sent = status === "sent";

  /** The arrow in flight: up and out, back in from below, over and over. */
  const flight = {
    transform: [
      "translateY(0px)",
      "translateY(-24px)",
      "translateY(24px)",
      "translateY(0px)",
    ],
    opacity: [1, 0, 0, 1],
  };

  return (
    <span className="relative block size-4" aria-hidden>
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-4">
        {/* Grouped so the shaft and head travel as one arrow rather than two
            strokes that agree about where they're going. */}
        <motion.g
          initial={false}
          animate={
            sending && !still
              ? flight
              : {
                  transform:
                    sent && !still ? "translateY(-24px)" : "translateY(0px)",
                  opacity: sent ? 0 : 1,
                }
          }
          transition={
            still
              ? instant
              : sending
                ? {
                    duration: 0.72,
                    // Four keyframes, so a bezier tuple would be read as one
                    // easing per segment. A named curve is the only safe form.
                    ease: "linear",
                    times: [0, 0.42, 0.5, 0.92],
                    repeat: Infinity,
                  }
                : { duration: 0.34, ease }
          }
        >
          <path d="M12 19.5V5.5" {...stroke} />
          <path d="M5.5 12 12 5.5 18.5 12" {...stroke} />
        </motion.g>
      </svg>

      <svg viewBox="0 0 24 24" className="absolute inset-0 size-4">
        <motion.path
          d="M4 12 9 17L20 6"
          {...stroke}
          initial={false}
          animate={{ pathLength: sent ? 1 : 0, opacity: sent ? 1 : 0 }}
          transition={still ? instant : sent ? drawOn(0.16) : drawOff()}
        />
      </svg>
    </span>
  );
}

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

  /**
   * Once it has gone: hold the tick long enough to read, close, then clear.
   *
   * The reset matters because this form is never unmounted — the dock keeps
   * every card alive so it can cross-fade between them — so without it the next
   * visitor to open the card finds the last message still sitting there, sent.
   * It happens after the card has shut, so nobody watches the fields empty.
   */
  useEffect(() => {
    if (status !== "sent") return;

    const timers = [
      setTimeout(onClose, 1600),
      setTimeout(() => {
        setName("");
        setEmail("");
        setMessage("");
        setStatus("idle");
      }, 2000),
    ];

    return () => timers.forEach(clearTimeout);
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
    <div className="flex h-full w-[min(23rem,calc(100vw-4rem))] select-text flex-col p-5">
      <div>
        <h2 className="text-xl font-medium leading-tight tracking-[-0.025em] text-foreground">
          Say hi
        </h2>
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex grow flex-col">
        <div className="flex grow flex-col overflow-hidden rounded-xl border border-line transition-colors duration-150 focus-within:border-foreground/30">
          <div className="grid sm:grid-cols-2">
            <label className="block px-3.5 py-3">
              <span className="block text-[11px] leading-none text-muted">Name</span>
              <input
                ref={firstFieldRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                maxLength={100}
                disabled={busy}
                className={inputClass}
              />
            </label>

            <label className="block border-t border-line px-3.5 py-3 sm:border-l sm:border-t-0">
              <span className="block text-[11px] leading-none text-muted">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={200}
                disabled={busy}
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex min-h-40 grow flex-col border-t border-line px-3.5 py-3 [@media(max-height:520px)]:min-h-20">
            <span className="block text-[11px] leading-none text-muted">Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              rows={6}
              placeholder="Tell me what you&rsquo;re thinking."
              maxLength={5000}
              disabled={busy}
              className={`${inputClass} grow resize-none leading-relaxed`}
            />
          </label>
        </div>

        <div className="mt-3 flex min-h-11 items-end gap-3">
          <div className="flex-1 text-xs font-light leading-relaxed">
            <AnimatePresence mode="wait" initial={false}>
              {status === "error" && error ? (
                <motion.p
                  key="error"
                  role="alert"
                  initial={still ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration.fast, ease }}
                  className="text-foreground/80"
                >
                  {error}{" "}
                  <a
                    href={`mailto:${profile.email}`}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Email instead.
                  </a>
                </motion.p>
              ) : (
                <motion.p
                  key="note"
                  initial={still ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration.fast, ease }}
                  className="text-muted"
                >
                  Pls don&rsquo;t try to sell me anything.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            aria-label={LABEL[status]}
            disabled={busy}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-foreground text-background transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-90 active:scale-[0.97] disabled:opacity-70 motion-reduce:active:scale-100"
          >
            <SendIcon status={status} still={Boolean(still)} />
          </button>
        </div>
      </form>
    </div>
  );
}
