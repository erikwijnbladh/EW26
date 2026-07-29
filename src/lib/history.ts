import type { Track } from "@/lib/data";
import { read, storeReady, write } from "@/lib/store";

/**
 * A listening history the site builds for itself.
 *
 * Spotify's `recently-played` is the obvious source and returns nothing usable
 * for this account, so the history is accumulated instead: every poll sees the
 * current track, and a track that sticks around joins a rolling list. That list
 * outlives any one request, which means Redis rather than module scope —
 * serverless instances are per-request and per-region, so anything held in
 * memory is a different list for every visitor and gone by morning.
 *
 * `recently-played` is still merged in when it returns anything. If the scope
 * gets fixed, real history simply starts flowing in alongside.
 */

const KEY = "now-playing:history:v1";

/**
 * How long a track must still be playing before it counts as played.
 *
 * Without this, skipping through six songs to find one records all six, and
 * the list becomes a log of things rejected in four seconds. The dwell is
 * measured across polls, so it costs nothing to track — a song either survives
 * to the next poll or it doesn't.
 */
const DWELL_MS = 30_000;

type Stored = {
  /** Newest first, distinct. */
  tracks: Track[];
  /** The track being watched to see whether it lasts. */
  pending?: { key: string; track: Track; since: number };
};

const keyOf = (track: Track) => `${track.title}::${track.artist}`;

/** Newest first, first occurrence wins, capped. */
function distinct(tracks: Track[], count: number): Track[] {
  const seen = new Set<string>();
  const out: Track[] = [];

  for (const track of tracks) {
    const key = keyOf(track);
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(track);

    if (out.length === count) break;
  }

  return out;
}

/**
 * The list to show, having folded in whatever this poll observed.
 *
 * `recent` is null when Spotify refused the call and [] when it genuinely had
 * nothing — only the second is a fact about the account, but neither is a
 * reason to drop what's already been collected.
 */
export async function remember({
  current,
  recent,
  count,
}: {
  current: Track | null;
  recent: Track[] | null;
  count: number;
}): Promise<Track[]> {
  // No store configured — locally, or before the integration is added. Behave
  // exactly as the site did before, using only what this request can see.
  if (!storeReady) {
    return distinct([...(current ? [current] : []), ...(recent ?? [])], count);
  }

  const stored = (await read<Stored>(KEY)) ?? { tracks: [] };

  let tracks = stored.tracks;
  let pending = stored.pending;

  // Anything Spotify reports as played is played — no dwell test needed, it
  // already applied its own by the time a track appears there.
  if (recent?.length) tracks = distinct([...recent, ...tracks], count);

  if (!current) {
    // Paused or stopped. Whatever was being timed doesn't get credit.
    pending = undefined;
  } else {
    const key = keyOf(current);

    if (pending?.key !== key) {
      pending = { key, track: current, since: Date.now() };
    } else if (Date.now() - pending.since >= DWELL_MS) {
      // Survived the dwell. Promoting an existing entry moves it back to the
      // front, which is right — playing something again makes it recent again.
      tracks = distinct([current, ...tracks], count);
    }
  }

  const next: Stored = { tracks, pending };

  // Only write when something moved. Polls are frequent and track changes are
  // not, so the overwhelming majority of these are reads.
  //
  // Two instances can interleave a read and a write here and lose one entry.
  // Left alone deliberately: it needs two visitors polling within the same
  // moment that a track changes, it costs one row, and the next poll repairs
  // it. A lock would be more machinery than the failure is worth.
  if (JSON.stringify(next) !== JSON.stringify(stored)) {
    await write(KEY, next);
  }

  // The live track leads even before it has earned a place in the history.
  return distinct([...(current ? [current] : []), ...tracks], count);
}
