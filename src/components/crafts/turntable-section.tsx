import { connection } from "next/server";
import { nowPlaying, NOW_PLAYING_COUNT } from "@/lib/data";
import { getPlaying } from "@/lib/spotify";
import { Turntable } from "@/components/crafts/turntable";

/**
 * The turntable, resolved per request like the old track strip: `/` is
 * prerendered and this is the hole in it that knows what's on right now.
 */
export async function TurntableSection() {
  await connection();

  const playing = await getPlaying(NOW_PLAYING_COUNT);
  const log = playing?.history ?? [];

  return (
    <Turntable
      initial={{
        current: playing?.current ?? null,
        playing: playing?.playing ?? false,
        history: (log.length ? log : nowPlaying).slice(0, NOW_PLAYING_COUNT),
      }}
    />
  );
}

/** Same footprint, no record yet. */
export function TurntableSkeleton() {
  return (
    <div className="relative aspect-square w-full" aria-busy aria-label="Turntable">
      <div className="absolute left-[44%] top-[46%] size-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/[0.07]" />
    </div>
  );
}
