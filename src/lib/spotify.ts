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

/**
 * The two things Spotify will actually tell you, kept apart.
 *
 * They used to be merged into one list with the live track at the front, which
 * read as "newest first" and wasn't. `recently-played` is a log of *finished*
 * plays: it never contains what is playing right now, and it only records a
 * track once it has been played far enough in — skip after eight seconds and
 * Spotify has decided you didn't play it, so it never appears at all.
 *
 * Merged, that produced the complaint this shape exists to fix. The live track
 * sat in slot 1 of what looked like a history, and skipping silently replaced
 * it: a song that appeared to be the newest entry in a list vanished out of
 * that list without ever moving down into it. Nothing was lost — it was never
 * in the log and was never going to be — but the presentation had promised
 * otherwise.
 */
export type Playing = {
  /** Playing right this second, or null when the player is idle. */
  current: Track | null;
  /** Finished plays, newest first. Never contains `current`. */
  history: Track[];
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
 * How long an answer is reused before Spotify is asked again.
 *
 * Enforced by `pending` at the bottom of this file, not by the Data Cache:
 * under `cacheComponents` nothing is cached unless it says `use cache`, and
 * both callers here — the streamed strip on `/` and the endpoint the widget
 * polls — are deliberately request-time. So this is the only throttle, and it
 * covers every caller rather than the subset Next chose to cache.
 *
 * Two calls per refresh, so at most 12 a minute against a limit measured in
 * the hundreds. The access token is held separately and outlives this by an
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

async function call(path: string, token: string) {
  // No `next: { revalidate }` — under `cacheComponents` a fetch outside a
  // `use cache` scope isn't stored, so it would have been inert config that
  // read like the thing doing the throttling. `pending` does that.
  return fetch(`${API}${path}`, {
    headers: { authorization: `Bearer ${token}` },
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

    // Nothing playing is still an answer: idle, with whatever log came back.
    // Returning null here — as this once did — made it indistinguishable from
    // "Spotify didn't reply", and the widget treats those opposite ways. It
    // holds the last known state through a failure, so a pause reported as a
    // failure froze the display mid-song.
    //
    // The log is filtered against the live track only because the same song
    // can genuinely appear in both: play it, finish it, then play it again.
    // Left in, it would show twice — once as playing and once as played.
    const history = (recent ?? [])
      .filter(
        (t) =>
          !current || !(t.title === current.title && t.artist === current.artist),
      )
      .slice(0, count);

    return { current, history };
  } catch {
    return null;
  }
}

/**
 * The last answer, reused for `REVALIDATE` seconds.
 *
 * Every caller here is request-time by design — the strip streamed into `/` and
 * the endpoint the widget polls — so there is no framework-level cache in front
 * of any of them. This is the throttle, and it is unconditional: however many
 * tabs are polling and however many people are loading the page, Spotify is
 * asked at most once per interval per instance.
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
