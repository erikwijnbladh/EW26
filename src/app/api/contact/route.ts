import { connection } from "next/server";
import { parse, send } from "@/lib/contact";

/**
 * What the "what's up" form posts to.
 *
 * `connection()` for the same reason as `/api/playing`: under `cacheComponents`
 * nothing is cached unless it says so, and this states the requirement in the
 * file rather than leaving it to be inferred.
 */

/**
 * One IP's recent submissions, newest last.
 *
 * A public endpoint that sends mail on request is a spam relay unless something
 * stops it, and the mail it sends lands in the one inbox this site exists to
 * protect. Held per instance in memory, which is the honest scope: serverless
 * spreads requests across instances, so a determined sender gets a multiple of
 * this. That's fine — the target is the accidental double-submit and the casual
 * script, not a distributed flood, and the alternative is a Redis dependency
 * for a contact form.
 *
 * Trimmed on read rather than on a timer, so an idle instance isn't holding a
 * `setInterval` open to tidy a map nobody is looking at.
 */
const hits = new Map<string, number[]>();

/** How many messages one address can send, and over what window. */
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * Who is asking, as far as it can be known.
 *
 * `x-forwarded-for` is a hop list and only the last entry is written by a proxy
 * we control, but on Vercel the platform normalises it, so the first is the
 * client. Spoofable in general; good enough to rate-limit on, since anyone able
 * to forge it can also just use more addresses.
 */
function client(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/** Whether this address has room to send, recording the attempt if so. */
function allowed(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);

  if (recent.length >= LIMIT) {
    // Rewritten even on refusal, so the trimmed list is what's stored.
    hits.set(ip, recent);
    return false;
  }

  recent.push(now);
  hits.set(ip, recent);

  // The map only ever grows otherwise: one entry per address that has ever
  // posted, held for the life of the instance. Swept here because this is the
  // only place anything is added.
  if (hits.size > 5_000) {
    for (const [key, times] of hits) {
      if (!times.some((at) => now - at < WINDOW_MS)) hits.delete(key);
    }
  }

  return true;
}

export async function POST(req: Request) {
  await connection();

  if (!allowed(client(req))) {
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
