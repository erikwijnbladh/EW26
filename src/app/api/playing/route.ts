import { NOW_PLAYING_COUNT, withFallback } from "@/lib/data";
import { diagnose, getPlaying } from "@/lib/spotify";

/**
 * What the music widget polls.
 *
 * `/` is statically rendered, so the tracks baked into its HTML are only as
 * fresh as the last regeneration — and a tab left open never asks for new HTML
 * at all. Without something like this, "Playing now" means "was playing when
 * the page happened to be built".
 *
 * Never cached: a stale answer here would defeat the entire point. Spotify is
 * still only asked once every few seconds no matter how many people are
 * polling — `getPlaying` throttles that itself.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // `?debug=1` reports what Spotify replied rather than what the widget made
  // of it — status codes and counts, no secrets. The widget failing quietly is
  // the correct behaviour for visitors and useless for working out why.
  if (new URL(request.url).searchParams.has("debug")) {
    return Response.json(await diagnose(), {
      headers: { "cache-control": "no-store" },
    });
  }

  const playing = await getPlaying(NOW_PLAYING_COUNT);

  // Topped up here rather than in the widget, so the polled answer and the
  // server-rendered one are the same list and hydration has nothing to correct.
  // null still means "no answer" and is passed through untouched — the widget
  // holds its current state on that, which padding would quietly override.
  const padded = playing && {
    ...playing,
    tracks: withFallback(playing.tracks),
  };

  return Response.json(padded, {
    // Belt and braces alongside `force-dynamic`: no CDN in front and no
    // browser cache either, so each poll reflects the player right now.
    headers: { "cache-control": "no-store" },
  });
}
