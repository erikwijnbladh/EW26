import { connection } from "next/server";
import { nowPlaying, NOW_PLAYING_COUNT } from "@/lib/data";
import { getPlaying } from "@/lib/spotify";
import { LatestPlaying, STATIC_MASK } from "@/components/latest-playing";

/**
 * The track strip, resolved per request rather than baked into the page.
 *
 * `/` is otherwise prerendered, and a prerender is only as current as the last
 * regeneration — which happens on request, so a site nobody visited for two
 * days served two-day-old tracks to whoever showed up next. `usePlaying`
 * corrected that a few hundred milliseconds after hydration, which is a flash
 * of a wrong answer rather than an absence of one, and no correction at all
 * without JavaScript.
 *
 * `connection()` is what moves this to request time: it marks the subtree
 * dynamic, so with PPR the rest of the page still ships as static HTML and
 * only this hole is filled per request. Spotify is not actually called per
 * request — `getPlaying` throttles to one call every `REVALIDATE` seconds
 * however many requests arrive — so this costs a render, not a round trip.
 */
export async function PlayingSection() {
  await connection();

  const playing = await getPlaying(NOW_PLAYING_COUNT);

  // Spotify unconfigured or unreachable: fall back to the hand-written list,
  // which is history rather than a live player, so it never claims to be
  // playing. Keyed on the list being empty rather than the answer being null,
  // so a paused player with no history still gets rows.
  const spotify = playing?.tracks ?? [];
  const tracks = (spotify.length ? spotify : nowPlaying).slice(
    0,
    NOW_PLAYING_COUNT,
  );

  return <LatestPlaying tracks={tracks} live={playing?.live ?? false} />;
}

/**
 * What the static shell holds until the real strip streams in.
 *
 * Shaped to the collapsed list rather than sized by guesswork: the same row
 * padding, the same 32px art tile setting the row height, the same fade and a
 * placeholder for the toggle. Nothing below it moves when the tracks land.
 *
 * The heading says "Latest playing" because that is the honest thing to say
 * before knowing — it's the one wording that stays true whether or not
 * something turns out to be playing, so the swap never reads as a correction.
 */
export function PlayingSkeleton() {
  const bar = "rounded-full bg-foreground/[0.06]";

  return (
    <section aria-label="Latest playing" aria-busy>
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-muted/70">
        Latest playing
        {/* Holds the status icon's place, so the heading doesn't jog. */}
        <span className="size-3.5" aria-hidden />
      </p>

      <div
        className="mt-4 overflow-hidden"
        style={{ maskImage: STATIC_MASK, WebkitMaskImage: STATIC_MASK }}
        aria-hidden
      >
        <ol>
          {/* Widths alternate so the placeholder reads as a list of songs
              rather than as a table with two ruled columns. */}
          {[
            ["w-32", "w-20"],
            ["w-40", "w-16"],
            ["w-28", "w-24"],
            ["w-36", "w-20"],
            ["w-24", "w-16"],
          ].map(([title, artist], i) => (
            <li
              key={i}
              className="flex items-center gap-3 border-t border-line py-2 first:border-t-0"
            >
              <span className="size-8 shrink-0 rounded-[3px] bg-foreground/[0.06]" />
              <span className={`h-3 ${title} ${bar}`} />
              <span className={`ml-auto h-3 ${artist} ${bar}`} />
            </li>
          ))}
        </ol>
      </div>

      {/* h-4 rather than h-3: the toggle is `text-xs`, whose 1rem line box is
          what actually sets its height, and the row below must not move. */}
      <span className={`mt-4 block h-4 w-28 ${bar}`} aria-hidden />
    </section>
  );
}
