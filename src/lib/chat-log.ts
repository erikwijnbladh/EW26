import { put } from "@vercel/blob";
import type { ChatRequest } from "@/lib/chat";

/**
 * Keeping a copy of what visitors ask the chat, so Erik can read it later.
 *
 * One private Vercel Blob per conversation, overwritten on every turn with the
 * whole transcript so far. The client already sends the history it is showing
 * with each question, so the latest write is always the complete conversation
 * and there's nothing to read back and append to.
 *
 * That history is the client's word, not a record — see `parseChatRequest` — so
 * a log can only be as honest as the browser that wrote it. The reply to the
 * newest question is the exception: that one is what the server actually
 * streamed. For a portfolio chat that's the right trade against a database.
 *
 * Optional, like everything else here but the model key: without
 * `BLOB_READ_WRITE_TOKEN` nothing is saved and the chat works the same.
 */

/** What the card sends to tie turns together. Anything else isn't logged. */
const CONVERSATION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Well past a healthy write, well short of the route's `maxDuration`. */
const SAVE_TIMEOUT = 8_000;

export function isLogging() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * The conversation id from a request body, if it carries a usable one.
 *
 * A random UUID from the card, so nobody can guess another visitor's id and
 * overwrite their log. Pulled out separately rather than folded into the chat
 * request, because the chain has no business knowing about it.
 */
export function conversationId(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const { conversation } = body as Record<string, unknown>;
  return typeof conversation === "string" && CONVERSATION.test(conversation)
    ? conversation.toLowerCase()
    : null;
}

type Entry = {
  /** The newest question with whatever reply it got, cut short or not. */
  request: ChatRequest;
  reply: string;
  /** How the newest reply ended. */
  outcome: "done" | "error" | "aborted";
};

/**
 * Write the conversation as it stands. Never throws: a failed save is worth a
 * line in the logs and nothing more — it must not cost the visitor the answer.
 *
 * Keyed by id alone, not by date: a conversation that runs past midnight would
 * otherwise land in two files. The Blob browser sorts by upload time anyway.
 */
export async function saveConversation(
  id: string,
  { request, reply, outcome }: Entry,
  req: Request,
) {
  if (!isLogging()) return;

  const now = new Date().toISOString();
  const transcript = {
    id,
    updatedAt: now,
    outcome,
    country: req.headers.get("x-vercel-ip-country") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
    turns: [
      ...request.history,
      { role: "user", content: request.message },
      ...(reply ? [{ role: "assistant", content: reply }] : []),
    ],
  };

  try {
    const write = put(`chats/${id}.json`, JSON.stringify(transcript, null, 2), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      abortSignal: AbortSignal.timeout(SAVE_TIMEOUT),
    });
    // Raced as well as aborted: the SDK retries on its own and doesn't always
    // notice the signal mid-retry, and an unreachable store must not hold the
    // function open until the platform kills it.
    await Promise.race([
      write,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timed out.")), SAVE_TIMEOUT),
      ),
    ]);
  } catch (cause) {
    console.error("[chat] couldn't save the conversation:", cause);
  }
}
