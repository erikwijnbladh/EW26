import type { Track } from "@/lib/data";

/**
 * Recently played, from Spotify.
 *
 * Uses the refresh-token grant: a one-off authorisation produces a long-lived
 * refresh token, which is traded for a short-lived access token per request.
 * That means no user interaction at build or request time. Three env vars are
 * needed — SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN —
 * and `npm run spotify:token` walks through producing the third.
 *
 * Every failure path returns null so the page falls back to the hand-written
 * list. A music widget must never be the reason the site doesn't render.
 */

export type Playing = {
  /** Newest first. The first entry is the live one when `live` is true. */
  tracks: Track[];
  /** Whether something is playing right now, as opposed to merely last. */
  live: boolean;
};

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

/**
 * How many plays to pull from the history endpoint, which caps at 50.
 *
 * Always the maximum, rather than a multiple of the number of rows wanted: it
 * is one request either way, and de-duplication makes the yield impossible to
 * predict from the row count. An album on repeat collapses fifty plays into a
 * handful of distinct tracks, and asking for thirty would just mean a short
 * list and no "view more" — so take the widest window on offer.
 */
const RECENT_LIMIT = 50;

/**
 * How long a cached response is served before Spotify is asked again. This is
 * the lowest revalidate on the page, so it also sets how often `/` itself
 * regenerates — the contributions fetch keeps its own 24h entry and is not
 * re-fetched along with it.
 *
 * Two calls per regeneration, so at most 12 a minute against a limit measured
 * in the hundreds. The access token is held separately and outlives this by an
 * hour, so it isn't re-minted each time.
 */
export const REVALIDATE = 10;

type SpotifyArtist = { name: string };
type SpotifyImage = { url?: string; width?: number };
type SpotifyTrack = {
  name?: string;
  artists?: SpotifyArtist[];
  album?: { images?: SpotifyImage[] };
  external_urls?: { spotify?: string };
};

/**
 * Hosts `next/image` is configured to load. This has to be a *subset* of
 * next.config's remotePatterns, never a superset: an unconfigured hostname
 * makes next/image throw during render, which fails the prerender of `/` and
 * so the whole build. Dropping the art instead costs a thumbnail.
 */
const ART_HOSTS = /(^|\.)scdn\.co$|(^|\.)spotifycdn\.com$/;

/**
 * Album art for a ~32px tile. Spotify serves 640/300/64 in descending order;
 * the smallest is short of a 2x tile, so take the smallest that clears it and
 * let the image optimiser do the rest.
 *
 * Exported for the host-allowlist tests.
 */
export function cover(images: SpotifyImage[] | undefined): string | undefined {
  const usable = (images ?? []).filter((i) => i.url);
  if (!usable.length) return undefined;

  const big = usable
    .filter((i) => (i.width ?? 0) >= 128)
    .sort((a, b) => (a.width ?? 0) - (b.width ?? 0));

  const url = (big[0] ?? usable[0]).url;
  if (!url) return undefined;

  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:" || !ART_HOSTS.test(hostname)) return undefined;
  } catch {
    return undefined;
  }

  return url;
}

function toTrack(item: SpotifyTrack | null | undefined): Track | null {
  if (!item?.name) return null;

  const artist = (item.artists ?? [])
    .map((a) => a.name)
    .filter(Boolean)
    .join(", ");

  return {
    title: item.name,
    artist: artist || "Unknown artist",
    url: item.external_urls?.spotify,
    image: cover(item.album?.images),
  };
}

/**
 * Access tokens live an hour. Next won't cache a POST, and marking it
 * no-store opts the whole page out of static rendering — which would mean a
 * token request plus two API calls on every single view. Held per instance
 * instead, so it's fetched about once an hour.
 */
let token: { value: string; expires: number; scope: string } | null = null;

/**
 * What the widget needs granted, and what a token missing each one looks like.
 *
 * Nothing declares these anywhere except the authorisation request that minted
 * the refresh token — there is no scope setting in the developer dashboard, so
 * a correct-looking app there rules nothing out. The grant is frozen at consent
 * and the only record of it comes back on every refresh, below.
 */
const REQUIRED_SCOPES = [
  "user-read-currently-playing",
  "user-read-recently-played",
] as const;

async function getAccessToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!id || !secret || !refresh) return null;
  if (token && Date.now() < token.expires) return token.value;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
    }),
  });

  if (!res.ok) {
    await complain("token refresh", res);
    return null;
  }

  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
  };

  if (!json.access_token) return null;

  // A minute of headroom, so a token can't expire mid-render.
  token = {
    value: json.access_token,
    expires: Date.now() + ((json.expires_in ?? 3600) - 60) * 1000,
    // Every refresh restates what the grant covers. Kept, because a token
    // short a scope fails one endpoint and serves the other perfectly, which
    // reads as a quirk of the data rather than a broken credential.
    scope: json.scope ?? "",
  };

  const granted = token.scope.split(" ").filter(Boolean);
  const missing = REQUIRED_SCOPES.filter((s) => !granted.includes(s));

  if (missing.length) {
    console.error(
      `[spotify] refresh token is missing ${missing.join(", ")} — ` +
        `re-run \`npm run spotify:token\` and replace SPOTIFY_REFRESH_TOKEN.`,
    );
  }

  return token.value;
}

/** The scopes the current refresh token actually carries. */
function grantedScopes(): string[] {
  return (token?.scope ?? "").split(" ").filter(Boolean);
}

async function call(path: string, token: string) {
  return fetch(`${API}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    next: { revalidate: REVALIDATE },
  });
}

/**
 * Say so when Spotify refuses a call.
 *
 * Every failure path here degrades to "no tracks", which is right for the page
 * but indistinguishable from a genuinely empty history — a 403 for a missing
 * scope and an account that hasn't played anything look identical on screen.
 * The status code is the one thing that tells them apart, so it goes to the
 * server log rather than nowhere. 401 means the refresh token no longer
 * carries the scope; 403 means it never did; 429 is rate limiting.
 */
async function complain(what: string, res: Response) {
  let detail = "";
  try {
    detail = (await res.text()).slice(0, 200);
  } catch {
    // Body already consumed or not readable — the status is the useful part.
  }

  console.error(`[spotify] ${what} failed: ${res.status} ${detail}`);
}

/** The track playing right now, or null when nothing is. */
async function getCurrent(token: string): Promise<Track | null> {
  const res = await call("/me/player/currently-playing", token);

  // 204 means the player is idle — a normal answer, not a failure.
  if (res.status === 204) return null;

  if (!res.ok) {
    await complain("currently-playing", res);
    return null;
  }

  const json = (await res.json()) as {
    is_playing?: boolean;
    currently_playing_type?: string;
    item?: SpotifyTrack | null;
  };

  // Podcasts come back on the same endpoint with a different item shape.
  if (!json.is_playing || json.currently_playing_type !== "track") return null;

  return toTrack(json.item);
}

async function getRecent(token: string): Promise<Track[] | null> {
  const res = await call(
    `/me/player/recently-played?limit=${RECENT_LIMIT}`,
    token,
  );

  // null, not []: a refused call and a genuinely empty history are different
  // facts, and only one of them should ever reach the page as "no history".
  if (!res.ok) {
    await complain("recently-played", res);
    return null;
  }

  const json = (await res.json()) as {
    items?: { track?: SpotifyTrack; played_at?: string }[];
  };

  // Sort rather than trust the order. Each item carries `played_at`, and the
  // list is only meaningfully "latest" if that's what it's ordered by —
  // leaning on the order the endpoint happens to return is an assumption the
  // reference doesn't actually make.
  const items = [...(json.items ?? [])].sort(
    (a, b) =>
      Date.parse(b.played_at ?? "") - Date.parse(a.played_at ?? "") || 0,
  );

  const tracks: Track[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const track = toTrack(item.track);
    if (!track) continue;

    // Spotify repeats a track every time it was played; the list reads as a
    // history, so the same song three times in a row is noise. Newest first
    // after the sort, so the play that survives is the most recent one.
    const key = `${track.title}::${track.artist}`;
    if (seen.has(key)) continue;

    seen.add(key);
    tracks.push(track);
  }

  return tracks;
}

async function fetchPlaying(count: number): Promise<Playing | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const [current, recent] = await Promise.all([
      getCurrent(token),
      getRecent(token),
    ]);

    // Nothing playing is still an answer: paused, with whatever history came
    // back behind it. Returning null here — as this used to — made it
    // indistinguishable from "Spotify didn't reply", and the widget treats
    // those opposite ways. It holds the last known list through a failure, so
    // a pause reported as a failure froze the display mid-song.
    if (!current) {
      return { tracks: (recent ?? []).slice(0, count), live: false };
    }

    const rest = (recent ?? []).filter(
      (t) => !(t.title === current.title && t.artist === current.artist),
    );

    return { tracks: [current, ...rest].slice(0, count), live: true };
  } catch {
    return null;
  }
}

/**
 * What Spotify actually says, for when the widget is wrong and the code looks
 * right. Reading the source can't distinguish a missing scope from an empty
 * history from a stale cache — only the wire can.
 *
 * Deliberately bypasses both the memo and the fetch cache, so it reports the
 * live state rather than whatever was decided ten seconds ago. Reports status
 * codes and counts only: no tokens, no response bodies, nothing that isn't
 * already inferable from the rendered page.
 */
export async function diagnose() {
  const env = {
    clientId: Boolean(process.env.SPOTIFY_CLIENT_ID),
    clientSecret: Boolean(process.env.SPOTIFY_CLIENT_SECRET),
    refreshToken: Boolean(process.env.SPOTIFY_REFRESH_TOKEN),
  };

  const token = await getAccessToken();
  if (!token) {
    return { env, gotAccessToken: false as const };
  }

  // The decisive field. Spotify restates the grant on every refresh, so this
  // is what the production token actually carries — not what was asked for,
  // and not what the dashboard implies.
  const granted = grantedScopes();
  const scopes = {
    granted,
    missing: REQUIRED_SCOPES.filter((s) => !granted.includes(s)),
  };

  const probe = (path: string) =>
    fetch(`${API}${path}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });

  const [current, recent] = await Promise.all([
    probe("/me/player/currently-playing"),
    probe(`/me/player/recently-played?limit=${RECENT_LIMIT}`),
  ]);

  const currentBody = current.ok
    ? ((await current.json()) as {
        is_playing?: boolean;
        currently_playing_type?: string;
      })
    : null;

  const recentBody = recent.ok
    ? ((await recent.json()) as { items?: { track?: SpotifyTrack }[] })
    : null;

  const items = recentBody?.items ?? [];
  const parsed = items.map((i) => toTrack(i.track)).filter(Boolean) as Track[];
  const unique = new Set(parsed.map((t) => `${t.title}::${t.artist}`));

  return {
    env,
    gotAccessToken: true as const,
    scopes,
    currentlyPlaying: {
      status: current.status,
      // 204 is the documented "nothing playing"; 200 with is_playing false is
      // a pause. Both land on the same screen, for different reasons.
      isPlaying: currentBody?.is_playing ?? null,
      type: currentBody?.currently_playing_type ?? null,
    },
    recentlyPlayed: {
      status: recent.status,
      returned: items.length,
      parsed: parsed.length,
      afterDeduplication: unique.size,
    },
  };
}

/**
 * The last answer, reused for `REVALIDATE` seconds.
 *
 * `next: { revalidate }` on the calls above already collapses repeats, but only
 * for requests Next decides to cache — and the endpoint the widget polls is
 * deliberately dynamic, so it can't rely on that. This makes the throttle
 * unconditional: however many tabs are polling, Spotify is asked at most once
 * per interval per instance.
 *
 * The in-flight promise is held rather than the resolved value, so callers that
 * arrive together share one request instead of each starting its own.
 */
let pending: {
  count: number;
  at: number;
  result: Promise<Playing | null>;
} | null = null;

/**
 * `count` tracks, newest first, with the live one at the front when there is
 * one. Returns null if Spotify isn't configured or doesn't answer.
 *
 * Safe to call as often as you like — see `pending` above.
 */
export function getPlaying(count: number): Promise<Playing | null> {
  const fresh =
    pending &&
    pending.count === count &&
    Date.now() - pending.at < REVALIDATE * 1000;

  if (fresh) return pending!.result;

  // `fetchPlaying` swallows its own failures, so this never holds a rejected
  // promise — a failure is cached as null, which throttles retries too.
  pending = { count, at: Date.now(), result: fetchPlaying(count) };

  return pending.result;
}
