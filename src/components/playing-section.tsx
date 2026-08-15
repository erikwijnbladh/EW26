import { connection } from "next/server";
import { nowPlaying, NOW_PLAYING_COUNT } from "@/lib/data";
import { getPlaying } from "@/lib/spotify";
import { LatestPlaying } from "@/components/latest-playing";

/**
 * The track strip, resolved per request rather than baked into the page.
 *
 * `/` is otherwise prerendered, and a prerender is only as current as the last
 * regeneration. `connection()` moves this subtree to request time while
 * `getPlaying` still throttles Spotify across callers.
 */
export async function PlayingSection() {
  await connection();

  const playing = await getPlaying(NOW_PLAYING_COUNT);

  // Spotify unconfigured or unreachable: fall back to the hand-written list,
  // which stands in for the log only. It never claims to be playing live.
  const log = playing?.history ?? [];
  const history = (log.length ? log : nowPlaying).slice(0, NOW_PLAYING_COUNT);

  return (
    <LatestPlaying
      current={playing?.current ?? null}
      playing={playing?.playing ?? false}
      history={history}
    />
  );
}

/** The streaming placeholder uses the resting widget's exact fixed geometry. */
export function PlayingSkeleton() {
  const bar = "rounded-full bg-foreground/[0.06]";

  return (
    <section aria-label="Latest playing" aria-busy>
      <p className="flex h-4 items-center gap-2 text-xs leading-4 text-muted/75">
        Latest playing
        <span className="size-3.5" aria-hidden />
      </p>

      <div
        className="listening-feature -mx-2 mt-3 grid h-14 grid-cols-[2rem_minmax(0,1fr)_minmax(0,0.58fr)] items-center gap-3 rounded-xl px-3"
        aria-hidden
      >
        <span className="size-8 rounded-[4px] bg-foreground/[0.06]" />
        <span className={`h-3 w-32 max-w-full ${bar}`} />
        <span className={`ml-auto h-3 w-20 max-w-full ${bar}`} />
      </div>

      <div className="mt-2 flex min-h-10 items-center gap-2" aria-hidden>
        <span className={`h-3 w-18 ${bar}`} />
        <span className="size-5 rounded-[3px] bg-foreground/[0.06]" />
        <span className={`h-3 w-28 ${bar}`} />
        <span className={`ml-auto h-3 w-4 ${bar}`} />
        <span className="size-3.5" />
      </div>
    </section>
  );
}
