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

/** How long a cached response is served before Spotify is asked again. */
const REVALIDATE = 60;

type SpotifyArtist = { name: string };
type SpotifyTrack = {
  name?: string;
  artists?: SpotifyArtist[];
  external_urls?: { spotify?: string };
};

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
  };
}

async function getAccessToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!id || !secret || !refresh) return null;

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
    // Not cacheable — Next doesn't cache POSTs. It doesn't need to be: the
    // calls below set the route's revalidate window, so a render only happens
    // once a minute and this runs at most that often.
    cache: "no-store",
  });

  if (!res.ok) return null;

  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

async function call(path: string, token: string) {
  return fetch(`${API}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    next: { revalidate: REVALIDATE },
  });
}

/** The track playing right now, or null when nothing is. */
async function getCurrent(token: string): Promise<Track | null> {
  const res = await call("/me/player/currently-playing", token);

  // 204 means the player is idle — a normal answer, not a failure.
  if (res.status === 204 || !res.ok) return null;

  const json = (await res.json()) as {
    is_playing?: boolean;
    currently_playing_type?: string;
    item?: SpotifyTrack | null;
  };

  // Podcasts come back on the same endpoint with a different item shape.
  if (!json.is_playing || json.currently_playing_type !== "track") return null;

  return toTrack(json.item);
}

async function getRecent(token: string, limit: number): Promise<Track[]> {
  const res = await call(`/me/player/recently-played?limit=${limit}`, token);
  if (!res.ok) return [];

  const json = (await res.json()) as {
    items?: { track?: SpotifyTrack }[];
  };

  const tracks: Track[] = [];
  const seen = new Set<string>();

  for (const item of json.items ?? []) {
    const track = toTrack(item.track);
    if (!track) continue;

    // Spotify repeats a track every time it was played; the list reads as a
    // history, so the same song three times in a row is noise.
    const key = `${track.title}::${track.artist}`;
    if (seen.has(key)) continue;

    seen.add(key);
    tracks.push(track);
  }

  return tracks;
}

/**
 * `count` tracks, newest first, with the live one at the front when there is
 * one. Returns null if Spotify isn't configured or doesn't answer.
 */
export async function getPlaying(count: number): Promise<Playing | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    // Ask for extra: de-duplication and dropping the live track both shorten
    // the history, and Spotify caps this endpoint at 50.
    const [current, recent] = await Promise.all([
      getCurrent(token),
      getRecent(token, Math.min(50, count * 3)),
    ]);

    if (!current) {
      return recent.length ? { tracks: recent.slice(0, count), live: false } : null;
    }

    const rest = recent.filter(
      (t) => !(t.title === current.title && t.artist === current.artist),
    );

    return { tracks: [current, ...rest].slice(0, count), live: true };
  } catch {
    return null;
  }
}
