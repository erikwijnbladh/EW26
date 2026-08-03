import { connection } from "next/server";
import { NOW_PLAYING_COUNT, nowPlaying } from "@/lib/data";
import { getPlaying } from "@/lib/spotify";

/**
 * The listening log — and the second place colour is allowed in, for the same
 * reason as the work rows: album art is a real artifact, not a treatment.
 *
 * Six covers, no titles until you point at one. The grid is what carries it;
 * ten rows of "song — artist" is a table nobody reads, whereas six squares of
 * cover art is the only block of colour on an otherwise monochrome page.
 */
export async function Listening() {
  await connection();

  const playing = await getPlaying(NOW_PLAYING_COUNT);

  // Spotify unconfigured or unreachable falls back to the hand-written list,
  // which has no artwork — so the grid renders as empty frames rather than
  // pretending to be a live answer.
  const log = playing?.history ?? [];
  const tracks = (log.length ? log : nowPlaying).slice(0, 6);
  const current = playing?.playing ? playing.current : null;

  return (
    <section aria-label="Listening">
      <div className="flex items-baseline justify-between gap-[var(--s3)]">
        <p className="label" style={{ margin: 0 }}>
          {current ? "Playing now" : "Last played"}
        </p>
        {current && (
          <p className="mono m-0 truncate" style={{ maxWidth: "60%" }}>
            {current.title} — {current.artist}
          </p>
        )}
      </div>

      <ul
        className="m-0 grid list-none p-0"
        style={{
          marginTop: "var(--s3)",
          gap: "var(--s2)",
          gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))",
        }}
      >
        {tracks.map((track, i) => (
          <li key={`${track.title}-${i}`}>
            <a
              href={track.url ?? "#"}
              target={track.url ? "_blank" : undefined}
              rel={track.url ? "noreferrer" : undefined}
              className="group block"
              aria-label={`${track.title} — ${track.artist}`}
            >
              <span
                className="artifact block"
                style={{ aspectRatio: "1", display: "block" }}
              >
                {track.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.image}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </span>
              <span
                className="mono mt-[var(--s1)] block truncate opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                aria-hidden
              >
                {track.artist}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Held while the log resolves, at the size it will land at. */
export function ListeningSkeleton() {
  return (
    <section aria-label="Listening" aria-busy>
      <p className="label" style={{ margin: 0 }}>
        Last played
      </p>
      <ul
        className="m-0 grid list-none p-0"
        style={{
          marginTop: "var(--s3)",
          gap: "var(--s2)",
          gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))",
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i}>
            <span className="artifact block" style={{ aspectRatio: "1" }} />
            <span className="mono mt-[var(--s1)] block opacity-0">—</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
