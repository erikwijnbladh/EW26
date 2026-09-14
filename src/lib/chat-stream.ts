export type ChatEvent =
  | { type: "delta"; text: string }
  | { type: "media"; media: "cat" }
  | { type: "error"; message: string }
  | { type: "done" };

/** Transport EOF is not proof that a reply completed. */
export async function readChatStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ChatEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "";
  let completed = false;
  const consume = (raw: string) => {
    if (!raw.trim()) return;
    const event = JSON.parse(raw) as ChatEvent;
    if (!event || typeof event !== "object") throw new Error("Invalid chat response.");
    if (event.type === "done") completed = true;
    else if (event.type === "delta" && typeof event.text === "string") onEvent(event);
    else if (event.type === "media" && event.media === "cat") onEvent(event);
    else if (event.type === "error" && typeof event.message === "string") onEvent(event);
    else throw new Error("Invalid chat response.");
  };
  try {
    while (!completed) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      if (buffer.length > 64 * 1024) throw new Error("Chat response is too large.");
      let cut: number;
      while (!completed && (cut = buffer.indexOf("\n")) !== -1) {
        consume(buffer.slice(0, cut));
        buffer = buffer.slice(cut + 1);
      }
      if (done) {
        if (!completed && buffer.trim()) consume(buffer);
        break;
      }
    }
    if (!completed) throw new Error("The reply was interrupted. Try again.");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Cancel the upstream generation when the reader stops, not just the request. */
export function createAnswerStream(
  answer: (signal: AbortSignal) => Promise<AsyncIterable<string>>,
  requestSignal: AbortSignal,
  showCat: boolean,
  timeoutMs = 25_000,
) {
  const upstream = new AbortController();
  const signal = AbortSignal.any([requestSignal, upstream.signal]);
  const encoder = new TextEncoder();
  let closed = false;
  const timer = setTimeout(() => upstream.abort(new Error("Reply timed out")), timeoutMs);
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: ChatEvent) => {
        if (!closed) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        signal.throwIfAborted();
        for await (const token of await answer(signal)) {
          signal.throwIfAborted();
          if (token) emit({ type: "delta", text: token });
        }
        signal.throwIfAborted();
        if (showCat) emit({ type: "media", media: "cat" });
        emit({ type: "done" });
      } catch {
        if (!closed && !requestSignal.aborted) {
          emit({ type: "error", message: signal.aborted
            ? "That reply took too long. Try again?"
            : "Something broke on the way back. Try that again?" });
        }
      } finally {
        clearTimeout(timer);
        if (!closed) { closed = true; controller.close(); }
      }
    },
    cancel() {
      closed = true;
      clearTimeout(timer);
      upstream.abort();
    },
  });
}
