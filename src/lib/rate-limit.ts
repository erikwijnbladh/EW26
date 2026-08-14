/**
 * Per-address request budgets for the public API routes.
 *
 * A public endpoint that spends money on request — sending mail, calling a
 * model — is somebody else's free tier unless something stops it. Held per
 * instance in memory, which is the honest scope: serverless spreads requests
 * across instances, so a determined caller gets a multiple of this. That's
 * fine — the target is the accidental double-submit and the casual script, not
 * a distributed flood, and the alternative is a Redis dependency for a
 * portfolio site.
 *
 * Trimmed on read rather than on a timer, so an idle instance isn't holding a
 * `setInterval` open to tidy a map nobody is looking at.
 */

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

export type RateLimit = (req: Request) => boolean;

/**
 * A budget of `limit` requests per address per `windowMs`. Returns a predicate
 * that records the attempt when it allows one — call it once per request, and
 * only where you mean to spend the budget.
 */
export function createRateLimit(limit: number, windowMs: number): RateLimit {
  /** One address's recent requests, newest last. */
  const hits = new Map<string, number[]>();

  return function allowed(req: Request) {
    const ip = client(req);
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((at) => now - at < windowMs);

    if (recent.length >= limit) {
      // Rewritten even on refusal, so the trimmed list is what's stored.
      hits.set(ip, recent);
      return false;
    }

    recent.push(now);
    hits.set(ip, recent);

    // The map only ever grows otherwise: one entry per address that has ever
    // called, held for the life of the instance. Swept here because this is the
    // only place anything is added.
    if (hits.size > 5_000) {
      for (const [key, times] of hits) {
        if (!times.some((at) => now - at < windowMs)) hits.delete(key);
      }
    }

    return true;
  };
}
