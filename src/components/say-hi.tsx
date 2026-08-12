"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { profile } from "@/lib/data";
import { drawOff, drawOn, duration, ease, instant, springSnappy } from "@/lib/motion";
import { sendOff } from "@/lib/paper-plane";

const fieldClass =
  "w-full rounded-xl border border-line bg-surface/50 px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors duration-150 placeholder:text-muted/70 focus:border-foreground/25 focus:bg-surface/80";

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
    y: [0, -24, 24, 0],
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
              : { y: sent && !still ? -24 : 0, opacity: sent ? 0 : 1 }
          }
          transition={
            still
              ? instant
              : sending
                ? {
                    duration: 1.05,
                    // Four keyframes, so a bezier tuple would be read as one
                    // easing per segment. A named curve is the only safe form.
                    ease: "easeInOut",
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
  const cardRef = useRef<HTMLDivElement>(null);

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
   * The send-off: the card folds into a paper plane and leaves.
   *
   * The dock is told to close while the plane is still on its lap rather than
   * after it — the flier is a fixed clone with no further need of the card, so
   * waiting would just leave an empty shell sitting open.
   *
   * The form is reset at the end because it is never unmounted: the dock keeps
   * every card alive so it can cross-fade between them, so without this the
   * next visitor to open it finds the last message still sitting there, sent.
   */
  useEffect(() => {
    if (status !== "sent") return;

    let gone = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const reset = () => {
      if (gone) return;
      setName("");
      setEmail("");
      setMessage("");
      setStatus("idle");
    };

    if (still || !cardRef.current) {
      timers.push(setTimeout(onClose, 1600), setTimeout(reset, 2000));
    } else {
      // A beat first, so the tick has drawn before the card folds over it.
      timers.push(
        setTimeout(() => {
          const card = cardRef.current;
          if (!card || gone) return;
          void sendOff(card).then(reset);
        }, 260),
        setTimeout(onClose, 1100),
      );
    }

    return () => {
      gone = true;
      timers.forEach(clearTimeout);
    };
  }, [status, still, onClose]);

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
    <div ref={cardRef} className="w-[min(23rem,calc(100vw-4rem))] select-text p-4">
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

        {/* Roomier than it was. The full-width button used to eat this space,
            and a contact box you can only see three lines of asks for a short
            message — which is not what this form is for. */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={6}
          placeholder="Hey Erik, I have a stupid idea and a budget"
          aria-label="Message"
          maxLength={5000}
          disabled={busy}
          className={`${fieldClass} resize-none`}
        />

        {/*
          The last row, and the reason the button is here rather than across
          the form: the chat card ends in exactly this — something on the left,
          a square send button hard against the bottom-right corner. Both cards
          put it the same distance from the same edge, so swapping tabs leaves
          it sitting still instead of crossing the card.

          Error copy swaps into the note's reserved space rather than adding a
          row. The dock measures a separate hidden copy of this form, so live
          state cannot safely change its height once the shell has opened.
        */}
        {/*
          Three lines of reserved height, and the copy anchored to the *bottom*
          of it. The note is one line and sits level with the button; an error
          grows upward into the space above it. Anchored to the top instead, a
          one-line note floats away from the button with nothing under it.

          Three, because the narrowest card leaves this column about 168px and
          the longest failure wraps to three lines there. It has to be reserved
          rather than found: the dock sizes itself from a hidden copy of this
          form that is always idle, so anything that grows the card after the
          shell has opened is simply clipped.
        */}
        <div className="mt-3 flex items-end gap-3">
          <div className="relative min-h-[3.75rem] flex-1 text-xs font-light">
            <AnimatePresence mode="wait" initial={false}>
              {status === "error" && error ? (
                <motion.p
                  key="error"
                  role="alert"
                  initial={still ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: duration.fast, ease }}
                  className="absolute inset-x-0 bottom-0 leading-relaxed text-foreground/80"
                >
                  {/* A short link rather than the address itself. Spelled out,
                      it is an unbreakable 23-character token — on the narrowest
                      card it can't share a line with anything and forces the
                      copy onto a fourth, past the reserved space. Anyone who
                      wants the address has the copy button two icons below. */}
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
                  className="absolute inset-x-0 bottom-0 leading-relaxed text-muted"
                >
                  Please don&rsquo;t try to sell me anything...
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="submit"
            aria-label={LABEL[status]}
            disabled={busy}
            whileHover={still || busy ? undefined : { scale: 1.04 }}
            whileTap={still || busy ? undefined : { scale: 0.94 }}
            transition={springSnappy}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-foreground text-background transition-opacity duration-150 hover:opacity-90 disabled:opacity-70"
          >
            <SendIcon status={status} still={Boolean(still)} />
          </motion.button>
        </div>
      </form>
    </div>
  );
}
