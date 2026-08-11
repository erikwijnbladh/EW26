import { connection } from "next/server";
import { isConfigured, parseChatRequest, streamAnswer } from "@/lib/chat";
import { createRateLimit } from "@/lib/rate-limit";

/**
 * What the chat card in the dock posts to.
 *
 * `connection()` for the same reason as `/api/contact`: under `cacheComponents`
 * nothing is cached unless it says so, and this states the requirement in the
 * file rather than leaving it to be inferred.
 *
 * The reply is newline-delimited JSON rather than raw text. A bare text stream
 * can only ever say one thing, and the moment the model call fails halfway
 * through a sentence there's no way to tell the difference between "finished"
 * and "died" — the body just stops. One small object per line costs nothing to
 * produce and lets the card show the half-answer it already has *and* say what
 * went wrong underneath it.
 */

/** Roughly one conversation's worth per address per window. */
const allowed = createRateLimit(30, 10 * 60 * 1000);

/** Long enough for a slow answer, short of the platform cutting the socket. */
export const maxDuration = 30;

type Event =
  | { type: "delta"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

const encoder = new TextEncoder();

function line(event: Event) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export async function POST(req: Request) {
  await connection();

  if (!allowed(req)) {
    return Response.json(
      { error: "That's a lot of questions. Give it a few minutes." },
      { status: 429 },
    );
  }

  if (!isConfigured()) {
    // A deployment missing the key is a configuration mistake, not a visitor
    // error, and it is invisible from the outside — so say so loudly here.
    console.error("[chat] not configured: ANTHROPIC_API_KEY is required.");
    return Response.json(
      { error: "The chat isn't switched on right now." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  const parsed = parseChatRequest(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const answer = await streamAnswer(parsed.value, req.signal);

        for await (const token of answer) {
          if (token) controller.enqueue(line({ type: "delta", text: token }));
        }

        controller.enqueue(line({ type: "done" }));
      } catch (cause) {
        // The visitor navigating away or hitting stop aborts the request, which
        // lands here as a rejection. It isn't a failure and there is nobody
        // left to tell about it.
        if (req.signal.aborted) return;

        console.error("[chat] stream failed:", cause);
        controller.enqueue(
          line({
            type: "error",
            message: "Something broke on the way back. Try that again?",
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      // Nginx and friends will happily buffer a streaming response into one
      // chunk, which turns token-by-token into a long pause and a paragraph.
      "x-accel-buffering": "no",
    },
  });
}
