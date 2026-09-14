/** Per-instance protection, not a distributed quota across serverless instances. */
export type RateLimit = (req: Request) => boolean;

export function createRateLimit(
  limit: number,
  windowMs: number,
  { maxClients = 5_000, now = Date.now } = {},
): RateLimit {
  const hits = new Map<string, { count: number; resetAt: number }>();
  let nextSweep = 0;

  return (req) => {
    // Vercel normalizes this header. Other hosts must sanitize it at their proxy.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const time = now();
    if (time >= nextSweep || hits.size >= maxClients) {
      for (const [key, bucket] of hits) {
        if (bucket.resetAt <= time) hits.delete(key);
      }
      nextSweep = time + Math.min(windowMs, 60_000);
    }

    const bucket = hits.get(ip);
    if (bucket && bucket.resetAt > time) {
      if (bucket.count >= limit) return false;
      bucket.count++;
      return true;
    }
    // Never evict a live budget: rotating identities must not reset other users.
    if (!bucket && hits.size >= maxClients) return false;
    hits.set(ip, { count: 1, resetAt: time + windowMs });
    return true;
  };
}
