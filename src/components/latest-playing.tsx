import { nowPlaying } from "@/lib/data";

/**
 * A stack of the last few tracks — each row sits slightly behind the one above
 * it and fades out toward the bottom, so only the newest is fully readable.
 */
export function LatestPlaying() {
  return (
    <div>
      <p className="pb-5 text-xs uppercase tracking-[0.08em] text-muted/70">
        Latest playing
      </p>

      <ol className="[mask-image:linear-gradient(to_bottom,#000_30%,transparent_100%)]">
        {nowPlaying.map((track, i) => (
          <li
            key={`${track.artist}-${track.title}`}
            className="relative -mt-1 flex items-baseline gap-4 rounded-2xl bg-surface/80 px-5 py-4 shadow-ring first:mt-0"
            style={{
              zIndex: nowPlaying.length - i,
              opacity: 1 - i * 0.17,
              transform: `scale(${1 - i * 0.02})`,
            }}
          >
            <span className="truncate text-[15px] text-foreground">
              {track.title}
            </span>
            <span className="ml-auto shrink-0 text-[15px] font-light text-muted">
              {track.artist}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
