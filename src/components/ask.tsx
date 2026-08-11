"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { duration, ease, easeInOut, springSnappy, springSoft } from "@/lib/motion";
import { useSmoothText } from "@/components/use-smooth-text";

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
  "What does he do?",
  "Where has he worked?",
  "What's he written?",
  "How do I reach him?",
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

/** Waiting on the first token. Three dots, breathing out of phase. */
function Thinking({ still }: { still: boolean }) {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block size-1.5 rounded-full bg-foreground/35"
          animate={still ? undefined : { opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.1,
            ease: "easeInOut",
            repeat: Infinity,
            delay: i * 0.16,
          }}
        />
      ))}
    </span>
  );
}

/**
 * One assistant turn. Separate component so the per-frame reveal re-renders
 * this and not the whole card — and so each reply gets its own reveal state,
 * since the hook is keyed by mount.
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
  const shown = useSmoothText(content, still);

  useEffect(() => {
    onReveal();
  }, [shown, onReveal]);

  // The caret belongs to the text, not the connection. The stream can finish a
  // beat before the reveal catches up to it, and dropping the caret there makes
  // the last few words look like they arrived after the answer ended.
  const writing = streaming || shown.length < content.length;

  if (!shown && streaming) return <Thinking still={still} />;

  return (
    <p className="text-[15px] leading-relaxed text-foreground/90">
      {shown}
      {writing && (
        <motion.span
          aria-hidden
          className="ml-0.5 inline-block h-[0.95em] w-[2px] translate-y-[0.15em] bg-foreground/60"
          animate={still ? undefined : { opacity: [1, 0.15, 1] }}
          transition={{ duration: 1, ease: "easeInOut", repeat: Infinity }}
        />
      )}
    </p>
  );
}

export function AskPanel({ open }: { open: boolean }) {
  const still = useReducedMotion();

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  const nextId = useRef(0);

  /** Whether the transcript is at the bottom — i.e. whether to keep it there. */
  const pinned = useRef(true);

  const stickToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !pinned.current) return;
    // Not smooth: the text grows a character at a time, so it already is, and a
    // smooth scroll re-targeted every frame never arrives.
    el.scrollTop = el.scrollHeight;
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
  }, []);

  useEffect(stickToBottom, [messages, stickToBottom]);

  // Focus once the dock has finished expanding, so the browser doesn't scroll
  // or repaint mid-morph. The measuring copy of this card is `visibility:
  // hidden`, which isn't focusable, so only the real one takes the caret.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 320);
    return () => clearTimeout(timer);
  }, [open]);

  // Closing the card mid-answer should stop the answer. The route aborts its
  // upstream call when this connection drops, so nothing keeps generating into
  // a page nobody is looking at.
  useEffect(() => {
    if (!open) abort.current?.abort();
  }, [open]);

  useEffect(() => () => abort.current?.abort(), []);

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
    <div className="flex w-[min(23rem,calc(100vw-3.5rem))] select-text flex-col p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[19px] font-medium leading-tight tracking-[-0.02em] text-foreground">
          Ask about Erik
        </h2>

        <AnimatePresence initial={false}>
          {!empty && (
            <motion.button
              type="button"
              initial={still ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast, ease }}
              onClick={() => {
                abort.current?.abort();
                abort.current = null;
                setBusy(false);
                setMessages([]);
                setError(null);
                inputRef.current?.focus();
              }}
              className="shrink-0 text-xs font-light text-muted transition-colors duration-150 hover:text-foreground"
            >
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        // The mask softens the top edge: scrolled-past text dissolves under the
        // heading instead of being guillotined by the overflow box.
        className="no-scrollbar mt-3 h-[min(15rem,40svh)] overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent_0,black_1.5rem)]"
      >
        {empty ? (
          <div className="flex h-full flex-col justify-end gap-3">
            <p className="text-[15px] leading-relaxed text-muted">
              Everything this knows comes from the rest of the site. Ask about
              the work, the writing, the stack, or how to get hold of him.
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
                className={
                  message.role === "user" ? "flex justify-end pl-8" : "pr-2"
                }
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
          aria-label="Ask a question about Erik"
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
