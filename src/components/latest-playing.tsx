import { nowPlaying } from "@/lib/data";

/**
 * A stack of the last few tracks — each row sits slightly behind the one above
 * it and fades out toward the bottom, so only the newest is fully readable.
 */
export function LatestPlaying() {
  return (
    <div>
      <p className="pb-4 font-mono text-xs lowercase tracking-wide text-muted">
        latest playing
      </p>

      <ol className="[mask-image:linear-gradient(to_bottom,#000_25%,transparent_100%)]">
        {nowPlaying.map((track, i) => (
          <li
            key={`${track.artist}-${track.title}`}
            className="relative flex items-baseline gap-3 rounded-xl border border-line bg-surface/70 px-4 py-3 first:mt-0 -mt-1"
            style={{
              zIndex: nowPlaying.length - i,
              opacity: 1 - i * 0.16,
              transform: `scale(${1 - i * 0.018})`,
            }}
          >
            <span className="truncate text-sm text-foreground">
              {track.title}
            </span>
            <span className="ml-auto shrink-0 text-sm text-muted">
              {track.artist}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
