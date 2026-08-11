import { connection } from "next/server";
import { parse, send } from "@/lib/contact";
import { createRateLimit } from "@/lib/rate-limit";

/**
 * What the "what's up" form posts to.
 *
 * `connection()` for the same reason as `/api/playing`: under `cacheComponents`
 * nothing is cached unless it says so, and this states the requirement in the
 * file rather than leaving it to be inferred.
 */

/**
 * How many messages one address can send, and over what window. The mail this
 * sends lands in the one inbox the site exists to protect, so the budget is
 * tight — five is a couple of honest retries, not a campaign.
 */
const allowed = createRateLimit(5, 10 * 60 * 1000);

export async function POST(req: Request) {
  await connection();

  if (!allowed(req)) {
    return Response.json(
      { error: "Too many messages. Try again in a little while." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  const parsed = parse(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const result = await send(parsed.value);
  if (!result.ok) {
    // 502 rather than 400: the submission was fine, the sending wasn't. The
    // distinction matters to anyone reading the logs later.
    return Response.json({ error: result.error }, { status: 502 });
  }

  return Response.json({ ok: true });
}
