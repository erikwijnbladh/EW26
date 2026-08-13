"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  duration,
  ease,
  easeInOut,
  instant,
  springSnappy,
  springSoft,
  wordIn,
  drawOn,
  drawOff,
} from "@/lib/motion";
import { useWordReveal } from "@/components/use-word-reveal";
import { DitherDot } from "@/components/dither-dot";
import { CopyIcon } from "@/components/copy-icon";

/**
 * The chat card in the dock.
 *
 * Talks to `/api/chat`, which answers as the site rather than as Erik and only
 * about him — see `lib/chat.ts` for where that boundary is actually enforced.
 * Nothing here tries to police the conversation; a guardrail in the browser is
 * a suggestion, and the model never sees this file.
 *
 * The card is a fixed size on purpose. The dock measures whichever tab is open
 * and animates its shell to fit, and it does that from a hidden copy of this
 * component that has no messages in it — so a transcript that grew the card
 * would be measured at its empty height and clipped at every other. The
 * transcript scrolls inside instead, which is what a chat window does anyway.
 */

type Role = "user" | "assistant";

type Message = {
  id: number;
  role: Role;
  content: string;
};

/** An error the server described. Anything else gets a generic line. */
class ReplyError extends Error {}

/** Short on purpose — long enough to be a real question, short enough to pair up. */
const PROMPTS = [
  "What do you do?",
  "Where have you worked?",
  "What have you built?",
  "How do I reach you?",
];

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * Send and stop share one box and never unmount, the same way the dock's
 * envelope and tick do — the arrow retracts as the square scales in, so the
 * button changes meaning without anything popping.
 */
function SendIcon({ busy }: { busy: boolean }) {
  return (
    <span className="relative block size-4" aria-hidden>
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-4">
        <motion.path
          d="M12 19.5V5.5"
          {...stroke}
          initial={false}
          animate={{ pathLength: busy ? 0 : 1, opacity: busy ? 0 : 1 }}
          transition={{ duration: busy ? 0.2 : 0.34, ease: busy ? easeInOut : ease }}
        />
        <motion.path
          d="M5.5 12 12 5.5 18.5 12"
          {...stroke}
          initial={false}
          animate={{ pathLength: busy ? 0 : 1, opacity: busy ? 0 : 1 }}
          transition={{ duration: busy ? 0.2 : 0.34, ease: busy ? easeInOut : ease, delay: busy ? 0 : 0.06 }}
        />
      </svg>

      <svg viewBox="0 0 24 24" className="absolute inset-0 size-4">
        <motion.rect
          x="7.5"
          y="7.5"
          width="9"
          height="9"
          rx="2"
          fill="currentColor"
          initial={false}
          animate={{ scale: busy ? 1 : 0.2, opacity: busy ? 1 : 0 }}
          transition={springSnappy}
          style={{ transformOrigin: "center" }}
        />
      </svg>
    </span>
  );
}

/**
 * What the clear button is doing.
 *
 * `vanishing` is a state rather than an unmount because the machine should put
 * itself away — the slot and the shreddings retract the way every other stroke
 * on this site leaves, instead of the whole icon fading out from underneath
 * you.
 */
type Phase = "idle" | "shredding" | "vanishing";

/**
 * Clearing the conversation: a bin that becomes a shredder and eats the paper.
 *
 * Built on the dock's envelope-to-tick — one box, nothing unmounts, strokes draw
 * on and retract off — but the two icons here share a stroke rather than merely
 * taking turns. The bin's lid and the shredder's slot are the same line: it
 * slides down the face, and as it goes the handle above it becomes a sheet of
 * paper and the bin below it becomes the shreddings. So it reads as one object
 * changing rather than two icons crossfading.
 *
 * The order is the point. Bin retracts, line drops, sheet draws in above it,
 * sheet feeds down through it, strips fall out underneath — and then the
 * shreddings pull back up into the slot and the slot itself unspools, so the
 * button leaves the way it arrived.
 */
function ShredderIcon({ phase }: { phase: Phase }) {
  // Two copies of this card exist — the real one and the hidden one the dock
  // measures — so a fixed id would put two identical clip paths in the document
  // under the same name.
  const slot = useId();

  /** The shredder side is present — the bin is not. */
  const machine = phase !== "idle";
  const shredding = phase === "shredding";
  const gone = phase === "vanishing";

  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <defs>
        <clipPath id={slot}>
          {/* Stops just above the line's resting place, so the sheet is eaten
              by the slot rather than sliding over it. */}
          <rect x="0" y="0" width="24" height="12.4" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${slot})`}>
        {/* The bin's handle, in the same place the paper will be. */}
        <motion.path
          d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          {...stroke}
          initial={false}
          animate={{ pathLength: machine ? 0 : 1, opacity: machine ? 0 : 1 }}
          transition={machine ? drawOff() : drawOn(0.26)}
        />

        <motion.g
          initial={false}
          // Held down through `vanishing` — snapping the sheet back up while it
          // still had any opacity left would flash it through the slot.
          animate={{ y: phase === "idle" ? 0 : 12 }}
          transition={{
            duration: shredding ? 0.34 : 0,
            ease: easeInOut,
            delay: shredding ? 0.58 : 0,
          }}
        >
          <motion.path
            d="M4 13V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5"
            {...stroke}
            initial={false}
            animate={{ pathLength: shredding ? 1 : 0, opacity: shredding ? 1 : 0 }}
            transition={shredding ? drawOn(0.2) : drawOff()}
          />
          <motion.path
            d="M14 2v5a1 1 0 0 0 1 1h5"
            {...stroke}
            initial={false}
            animate={{ pathLength: shredding ? 1 : 0, opacity: shredding ? 1 : 0 }}
            transition={shredding ? drawOn(0.3) : drawOff()}
          />
        </motion.g>
      </g>

      {/* Lid and slot are one stroke. Through the morph it travels rather than
          redrawing; only at the end does it unspool. */}
      <motion.path
        d="M3 6h18"
        {...stroke}
        initial={false}
        animate={{
          y: machine ? 7 : 0,
          pathLength: gone ? 0 : 1,
          opacity: gone ? 0 : 1,
        }}
        transition={{
          ...(gone ? drawOff(0.14) : drawOn()),
          y: { duration: 0.36, ease: easeInOut, delay: shredding ? 0.06 : 0 },
        }}
      />

      {/* The bin, in the same place the shreddings will be. */}
      <motion.path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
        {...stroke}
        initial={false}
        animate={{ pathLength: machine ? 0 : 1, opacity: machine ? 0 : 1 }}
        transition={machine ? drawOff(0.03) : drawOn(0.3)}
      />

      {/* Drawn top-down rather than Lucide's bottom-up: `pathLength` fills from
          the start of the path, and the other way round they would retract into
          the machine instead of falling out of it — which is exactly what they
          should do on the way back, and do, for free. */}
      {["M6 17v3", "M10 17v5", "M14 17v2", "M18 17v3"].map((strip, i) => (
        <motion.path
          key={strip}
          d={strip}
          {...stroke}
          initial={false}
          animate={{ pathLength: shredding ? 1 : 0, opacity: shredding ? 1 : 0 }}
          transition={shredding ? drawOn(0.66 + i * 0.05) : drawOff(i * 0.03)}
        />
      ))}
    </svg>
  );
}

/** Copies a value and says so, using the same envelope-to-tick as the dock. */
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : `Copy ${value}`}
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
      }}
      className="ml-1 inline-flex translate-y-[0.2em] text-muted transition-colors duration-150 hover:text-foreground"
    >
      <CopyIcon copied={copied} />
    </button>
  );
}

/**
 * Who is answering.
 *
 * The site's own dot — the one beside the name in the nav and swooping around
 * the lists — doing duty as the chat's persona. It sits where the waiting
 * indicator used to and never leaves, so the thing that tells you an answer is
 * coming is the same thing that is still there once it has arrived. It only
 * changes pace.
 *
 * A dithered sphere on a shader, so it is soft and always turning: slowly while
 * it is only an identity, quicker while a reply is on its way. That is the whole
 * state change — no second element, nothing to swap, and the difference reads
 * without ever being a face pulling an expression.
 *
 * `awake` is a real cost control, not a nicety. This is a WebGL canvas with its
 * own animation loop, and the dock keeps every card mounted plus a hidden copy
 * of each for measuring — so an ungated dot would run two shaders forever,
 * including for the card nobody has opened. Mounted only while the chat is
 * open; the box it lives in keeps its size either way, so the measurement the
 * dock takes never moves.
 */
function Persona({
  thinking,
  awake,
  still,
}: {
  thinking: boolean;
  awake: boolean;
  still: boolean;
}) {
  const box = useRef<HTMLSpanElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  // The dock measures a hidden copy of this card, and that copy would otherwise
  // run a second shader behind `visibility: hidden` for as long as the chat is
  // open. It needs the box, which costs nothing; it does not need the canvas.
  useLayoutEffect(() => {
    setOnScreen(
      !!box.current && getComputedStyle(box.current).visibility !== "hidden",
    );
  }, []);

  return (
    <span ref={box} className="relative block size-8 shrink-0" aria-hidden>
      <motion.span
        className="absolute inset-0 block"
        initial={false}
        animate={{ opacity: thinking ? 1 : 0.55 }}
        transition={still ? instant : { duration: 0.32, ease }}
      >
        {awake && onScreen ? (
          <DitherDot
            speed={still ? 0 : thinking ? 3.6 : 1.1}
            size={0.22}
            minPixelRatio={3}
          />
        ) : null}
      </motion.span>
    </span>
  );
}

/**
 * One assistant turn. Separate component so the reveal re-renders this and not
 * the whole card — and so each reply gets its own reveal state, since the hook
 * is keyed by mount.
 */
function Reply({
  content,
  streaming,
  still,
  onReveal,
}: {
  content: string;
  streaming: boolean;
  still: boolean;
  onReveal: () => void;
}) {
  const tokens = useWordReveal(content, !streaming, still);

  useEffect(() => {
    onReveal();
  }, [tokens, onReveal]);

  // No waiting state of its own any more: the face beside this is what says an
  // answer is coming, and it stays put once the words arrive. There is nothing
  // left to hand over to, so nothing left to glitch.
  return (
    <p className="text-[15px] leading-relaxed text-foreground/90">
          {tokens.map((token, i) => (
            <motion.span
              key={i}
              // Deliberately inline, not inline-block. Boxing each word makes
              // its width round on its own, and the accumulated error shows up
              // as uneven word spacing that outlives the animation — a
              // permanent typographic cost for a half-second effect. Blur and
              // opacity apply to inline boxes; only a transform would have
              // needed the block, which is why there isn't one.
              initial={still ? false : { opacity: 0, filter: "blur(2.5px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={wordIn}
            >
              {token.href ? (
                // `nowrap` holds the address, its copy button and the full stop
                // after it together — the three read as one thing and shouldn't
                // be split across a line break.
                <span className="whitespace-nowrap">
                  <a
                    href={token.href}
                    {...(token.external
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                    className="underline underline-offset-2 transition-colors duration-150 hover:text-foreground"
                  >
                    {token.text}
                  </a>
                  {token.copy && <CopyButton value={token.copy} />}
                  {token.tail}
                </span>
              ) : (
                token.text
              )}
        </motion.span>
      ))}
    </p>
  );
}

export function AskPanel({ open }: { open: boolean }) {
  const still = useReducedMotion();

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const nextId = useRef(0);

  /** Whether the transcript is at the bottom — i.e. whether to keep it there. */
  const pinned = useRef(true);

  const stickToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !pinned.current) return;
    // Not smooth: the text arrives a word at a time, so it already is, and a
    // smooth scroll re-targeted every frame never arrives.
    el.scrollTop = el.scrollHeight;
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
  }, []);

  // `open` is in here because the answer keeps arriving while the card is shut:
  // reopening onto the middle of a reply you missed is worse than not having
  // closed it.
  useEffect(stickToBottom, [messages, open, stickToBottom]);

  // Focus once the dock has finished expanding, so the browser doesn't scroll
  // or repaint mid-morph. The measuring copy of this card is `visibility:
  // hidden`, which isn't focusable, so only the real one takes the caret.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 320);
    return () => clearTimeout(timer);
  }, [open]);

  // Only on unmount. Closing the card deliberately does *not* stop the answer —
  // the request keeps streaming into state and the whole reply is waiting when
  // it's opened again. The card is closed, not gone: the dock keeps it mounted,
  // so there is something left to stream into. On a real unmount there isn't.
  useEffect(() => () => abort.current?.abort(), []);

  // The whole morph has to play before the transcript goes: clearing on the
  // click empties the card, unmounts the button and takes the animation with
  // it. Then `vanishing` keeps it mounted a moment longer so the machine can
  // unspool rather than blink out — and by the time it does unmount there is
  // nothing left on screen to disappear.
  useEffect(() => {
    if (phase === "idle") return;

    if (phase === "shredding") {
      const shredded = setTimeout(() => {
        abort.current?.abort();
        abort.current = null;
        setBusy(false);
        setMessages([]);
        setError(null);
        setPhase("vanishing");
      }, 1100);

      return () => clearTimeout(shredded);
    }

    const away = setTimeout(() => {
      setPhase("idle");
      inputRef.current?.focus();
    }, 520);

    return () => clearTimeout(away);
  }, [phase]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      // The turns as they stand — the ones this question is a follow-up to,
      // read before the state update that adds it.
      const history = messages.map(({ role, content }) => ({ role, content }));

      const replyId = nextId.current + 1;
      nextId.current += 2;

      setMessages((prev) => [
        ...prev,
        { id: replyId - 1, role: "user", content: question },
        { id: replyId, role: "assistant", content: "" },
      ]);
      setDraft("");
      setError(null);
      setBusy(true);
      pinned.current = true;

      const controller = new AbortController();
      abort.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: question, history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          // The route sends a reason worth showing; a proxy failing in front of
          // it won't, so there's a fallback that doesn't say "undefined".
          const body = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new ReplyError(body?.error ?? "That didn't go through. Try again?");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Newline-delimited JSON: one event per line, and a chunk boundary can
        // land anywhere, so whatever trails the last newline waits for more.
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let cut: number;
          while ((cut = buffer.indexOf("\n")) !== -1) {
            const raw = buffer.slice(0, cut).trim();
            buffer = buffer.slice(cut + 1);
            if (!raw) continue;

            let event: { type?: string; text?: string; message?: string };
            try {
              event = JSON.parse(raw);
            } catch {
              continue;
            }

            if (event.type === "delta" && event.text) {
              const chunk = event.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === replyId ? { ...m, content: m.content + chunk } : m,
                ),
              );
            } else if (event.type === "error") {
              // Mid-stream failure. Whatever arrived before it stays on screen —
              // half an answer plus a reason beats the answer vanishing.
              throw new ReplyError(
                event.message ?? "Something broke on the way back.",
              );
            }
          }
        }
      } catch (cause) {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof ReplyError
            ? cause.message
            : "Couldn't reach the server. Check your connection.",
        );
        // An assistant turn that never got a word is just an empty gap.
        setMessages((prev) =>
          prev.filter((m) => m.id !== replyId || m.content.length > 0),
        );
      } finally {
        if (abort.current === controller) {
          abort.current = null;
          setBusy(false);
        }
      }
    },
    [busy, messages],
  );

  const stop = useCallback(() => {
    const controller = abort.current;
    if (!controller) return;
    controller.abort();
    abort.current = null;
    setBusy(false);
    // Drop the reply if it never started; keep it if it did.
    setMessages((prev) =>
      prev.filter((m, i) => i !== prev.length - 1 || m.content.length > 0),
    );
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) stop();
    else void send(draft);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, shift+enter breaks the line — the convention everyone
    // already has in their fingers.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy) void send(draft);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex w-[min(23rem,calc(100vw-4rem))] select-text flex-col p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[19px] font-medium leading-tight tracking-[-0.02em] text-foreground">
          What do you want to know?
        </h2>

        <AnimatePresence initial={false}>
          {(!empty || phase !== "idle") && (
            <motion.button
              type="button"
              aria-label="Clear the conversation"
              initial={still ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast, ease }}
              onClick={() => setPhase("shredding")}
              disabled={phase !== "idle"}
              className="shrink-0 text-muted transition-colors duration-150 hover:text-foreground"
            >
              <ShredderIcon phase={phase} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/*
        The face is pinned to the bottom-left of this box rather than living
        with the answers, so it never scrolls out of the conversation — it is
        the one thing here that is always on screen. Everything inside the
        scroller is inset past it; the face itself sits outside the scroller,
        which is what keeps it still while the transcript moves behind it.
      */}
      {/*
        `grow` with a floor rather than a fixed height: the dock sizes its shell
        to the taller of its two cards, and this is where that card's extra
        height goes — into more transcript. The floor is what the height used to
        be, so the card still measures the same when there is no slack to take.
      */}
      <div className="relative mt-3 min-h-[min(15rem,40svh)] grow [@media(max-height:520px)]:min-h-[6.5rem]">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          // The mask softens the top edge: scrolled-past text dissolves under
          // the heading instead of being guillotined by the overflow box.
          className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain pl-11 [mask-image:linear-gradient(to_bottom,transparent_0,black_1.5rem)]"
        >
          {empty ? (
            // `min-h-full`, not `h-full`, and for the same reason the message
            // column below uses it: pinned to an exact height, anything taller
            // than the box overflows upward past the top of the scroller, where
            // it cannot be scrolled back to. It has to be able to grow.
            <div className="flex min-h-full flex-col justify-end gap-3">
              {/* Short on purpose. The face takes a column out of this box, so
                  the prompts below wrap one to a line — and the second sentence
                  this used to carry ("ask about the work, the stack…") is what
                  those prompts already are. Together they overflowed and pushed
                  this off the top of the scroller. */}
              <p className="text-[15px] leading-relaxed text-muted">
                It&rsquo;s me, more or less — answering from what&rsquo;s on the
                rest of the site.
              </p>

              <div className="flex flex-wrap gap-1.5">
                {PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    type="button"
                    initial={still ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springSoft, delay: 0.08 + i * 0.05 }}
                    whileTap={still ? undefined : { scale: 0.97 }}
                    onClick={() => void send(prompt)}
                    className="rounded-full border border-line bg-surface/50 px-3 py-1.5 text-[13px] text-muted transition-colors duration-150 hover:border-foreground/25 hover:text-foreground"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            // `justify-end` against a full-height column: the first couple of
            // turns sit on the composer rather than floating at the top of an
            // empty box, and the transcript starts scrolling once it outgrows it.
            <div className="flex min-h-full flex-col justify-end gap-4">
              {messages.map((message, i) => (
                <motion.div
                  key={message.id}
                  initial={still ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={springSoft}
                  className={message.role === "user" ? "flex justify-end" : "pr-2"}
                >
                  {message.role === "user" ? (
                    <p className="rounded-2xl rounded-br-md bg-foreground/[0.07] px-3.5 py-2 text-[15px] leading-relaxed text-foreground">
                      {message.content}
                    </p>
                  ) : (
                    <Reply
                      content={message.content}
                      streaming={busy && i === messages.length - 1}
                      still={Boolean(still)}
                      onReveal={stickToBottom}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <span className="pointer-events-none absolute bottom-0 left-0">
          <Persona thinking={busy} awake={open} still={Boolean(still)} />
        </span>
      </div>

      {/*
        `role="alert"` so it's announced rather than silently appearing — the
        answer simply stopping is easy to miss, and the reason lives here.
      */}
      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={still ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={still ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: duration.fast, ease }}
            className="overflow-hidden text-xs font-light text-foreground/80"
          >
            <span className="mt-2 block">{error}</span>
          </motion.p>
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="mt-3 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask something"
          aria-label="Ask a question"
          maxLength={1000}
          className="no-scrollbar min-h-[2.75rem] w-full flex-1 resize-none rounded-xl border border-line bg-surface/50 px-3.5 py-3 text-[15px] leading-tight text-foreground outline-none transition-colors duration-150 placeholder:text-muted/70 focus:border-foreground/25 focus:bg-surface/80"
        />

        <motion.button
          type="submit"
          aria-label={busy ? "Stop" : "Send"}
          disabled={!busy && !draft.trim()}
          whileHover={still ? undefined : { scale: 1.04 }}
          whileTap={still ? undefined : { scale: 0.94 }}
          transition={springSnappy}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-foreground text-background transition-opacity duration-150 hover:opacity-90 disabled:opacity-30"
        >
          <SendIcon busy={busy} />
        </motion.button>
      </form>
    </div>
  );
}
