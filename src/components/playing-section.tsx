import { connection } from "next/server";
import {
  nowPlaying,
  NOW_PLAYING_COUNT,
  NOW_PLAYING_PREVIEW,
} from "@/lib/data";
import { GAP, PAD, PEEK, STATIC_MASK, TUCK, stackedStyle } from "@/lib/deck";
import { getPlaying } from "@/lib/spotify";
import { LatestPlaying } from "@/components/latest-playing";

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
  // which stands in for the log only. It is history rather than a live player,
  // so `current` stays null and the widget never claims to be playing
  // something it made up. Keyed on the log being empty rather than the answer
  // being null, so an idle player with no finished plays still gets cards.
  const log = playing?.history ?? [];
  const history = (log.length ? log : nowPlaying).slice(0, NOW_PLAYING_COUNT);

  return <LatestPlaying current={playing?.current ?? null} history={history} />;
}

/**
 * What the static shell holds until the real strip streams in.
 *
 * A copy of the deck in its settled, unmeasured state — the same thing
 * `LatestPlaying` renders on the server before the client has measured
 * anything. Same card markup, same gap and padding, same tuck and blur off
 * `stackedStyle`, same fade. Only the text is replaced with placeholder bars.
 *
 * Built out of the real constants rather than eyeballed, because the failure
 * mode of guessing is the page jumping when the tracks land, which is the
 * exact thing streaming the strip was meant to stop.
 *
 * It reserves the log and not the live slot, because it cannot know yet whether
 * anything is playing and the log is the part that is always there. When a song
 * turns out to be playing its card drops in above, which pushes the page down
 * once — the right way round: a card arriving reads as an arrival, whereas a
 * placeholder that resolved to nothing would read as something being taken away.
 *
 * The heading says "Recently played" for the same reason. It's what the deck
 * underneath it actually is, true whether or not a live card lands above it.
 */
export function PlayingSkeleton() {
  const bar = "rounded-full bg-foreground/[0.06]";

  // Widths alternate so the placeholder reads as a list of songs rather than
  // as a table with two ruled columns.
  const rows = [
    ["w-32", "w-20"],
    ["w-40", "w-16"],
    ["w-28", "w-24"],
    ["w-36", "w-20"],
    ["w-24", "w-16"],
  ];

  // The same correction `LatestPlaying` applies before its first measurement:
  // the document lays the cards out untucked, leaving the stack floating above
  // a hole the size of the tuck it hasn't been told about.
  const settle = PEEK - PAD - TUCK * (NOW_PLAYING_PREVIEW - 1);

  return (
    <section aria-label="Music" aria-busy>
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-muted/70">
        Recently played
        {/* Holds the status icon's place, so the heading doesn't jog. */}
        <span className="size-3.5" aria-hidden />
      </p>

      {/* Bled out and padded back in, so the clip doesn't cut the card shadows
          off flat against both edges — as in `LatestPlaying`. */}
      <div
        className="-mx-3 mt-4 overflow-hidden px-3"
        style={{ maskImage: STATIC_MASK, WebkitMaskImage: STATIC_MASK }}
        aria-hidden
      >
        <ol
          className="relative flex flex-col"
          style={{ gap: GAP, paddingBottom: PAD, marginBottom: settle }}
        >
          {rows.map(([title, artist], i) => (
            <li
              key={i}
              // Front of the deck paints over the back of it, as in the real
              // stack — document order would tuck each card the wrong way.
              style={{ position: "relative", zIndex: rows.length - i }}
            >
              <div
                style={stackedStyle(i, NOW_PLAYING_PREVIEW)}
                className="track-card flex items-center gap-3 rounded-xl px-3 py-2"
              >
                <span className="size-8 shrink-0 rounded-[3px] bg-foreground/[0.06]" />
                <span className={`h-3 ${title} ${bar}`} />
                <span className={`ml-auto h-3 ${artist} ${bar}`} />
              </div>
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
