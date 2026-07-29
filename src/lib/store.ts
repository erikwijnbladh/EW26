/**
 * A two-call key/value store over the Redis REST API.
 *
 * Spoken to with `fetch` rather than a client library. Vercel KV and the
 * marketplace Redis integrations both expose the same Upstash-compatible REST
 * shape, they just name their environment variables differently — so accepting
 * both pairs costs one `??` and removes a dependency along with the question of
 * which SDK this project is supposed to be on.
 *
 * Nothing here throws. The store is an enhancement to a widget that already has
 * a fallback, so an unreachable Redis has to degrade to "no stored history",
 * never to a failed render.
 */

const URL_BASE =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;

const TOKEN =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

/** Whether a store is configured at all. Everything degrades when it isn't. */
export const storeReady = Boolean(URL_BASE && TOKEN);

async function command(path: string, init?: RequestInit) {
  if (!URL_BASE || !TOKEN) return null;

  try {
    const res = await fetch(`${URL_BASE}/${path}`, {
      ...init,
      headers: { authorization: `Bearer ${TOKEN}` },
      // Never let Next cache these: the whole point of the store is that it
      // reflects writes made by other instances moments ago.
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[store] ${path.split("/")[0]} failed: ${res.status}`);
      return null;
    }

    return (await res.json()) as { result?: unknown };
  } catch (error) {
    console.error(`[store] ${path.split("/")[0]} threw:`, error);
    return null;
  }
}

/** The value at `key`, or null if it's unset, unreachable, or unparseable. */
export async function read<T>(key: string): Promise<T | null> {
  const body = await command(`get/${encodeURIComponent(key)}`);
  const raw = body?.result;

  if (typeof raw !== "string") return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Something else wrote this key, or the schema moved on. Treat it as
    // absent — the caller will overwrite it with something valid.
    console.error(`[store] ${key} held unparseable JSON`);
    return null;
  }
}

/** Stores `value` as JSON. Returns whether it landed. */
export async function write(key: string, value: unknown): Promise<boolean> {
  const body = await command(`set/${encodeURIComponent(key)}`, {
    method: "POST",
    body: JSON.stringify(value),
  });

  return body?.result === "OK";
}
