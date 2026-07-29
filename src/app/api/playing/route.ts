import { connection } from "next/server";
import { NOW_PLAYING_COUNT } from "@/lib/data";
import { getPlaying } from "@/lib/spotify";

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
 *
 * `connection()` rather than `dynamic = "force-dynamic"`, which
 * `cacheComponents` rejects. Nothing is cached by default under that flag, so
 * this is belt and braces — but it states the requirement in the file instead
 * of leaving it to be inferred from what the handler happens to call.
 */
export async function GET() {
  await connection();

  const playing = await getPlaying(NOW_PLAYING_COUNT);

  return Response.json(playing, {
    // Belt and braces alongside `force-dynamic`: no CDN in front and no
    // browser cache either, so each poll reflects the player right now.
    headers: { "cache-control": "no-store" },
  });
}
