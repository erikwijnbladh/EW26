import Image from "next/image";
import { profile, NOW_PLAYING_COUNT, withFallback } from "@/lib/data";
import { getContributions } from "@/lib/github";
import { getPlaying } from "@/lib/spotify";
import { Reveal } from "@/components/reveal";
import { LatestPlaying } from "@/components/latest-playing";
import { Contributions } from "@/components/contributions";
import { BuiltWith } from "@/components/built-with";

export default async function Home() {
  const [contributions, playing] = await Promise.all([
    getContributions("erikwijnbladh"),
    getPlaying(NOW_PLAYING_COUNT),
  ]);

  // Whatever Spotify gave, topped up to a full list with the hand-written one.
  // Covers all of it: nothing configured, nothing reachable, and the case that
  // actually happens here — a live track with no history behind it.
  const tracks = withFallback(playing?.tracks ?? []);
  const live = playing?.live ?? false;

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-40 pt-4 sm:pb-44">
      <section>
        <Reveal onMount>
          <div className="relative aspect-[7/6] w-full overflow-hidden rounded-2xl shadow-ring">
            <Image
              src="/images/pfp.png"
              alt={profile.name}
              fill
              sizes="(max-width: 640px) 90vw, 448px"
              quality={90}
              className="object-cover object-top grayscale"
              priority
            />
          </div>
        </Reveal>
      </section>

      <div>
        <Reveal onMount delay={0.06}>
          <p className="mt-8 text-base leading-relaxed text-muted">
            {profile.intro}
          </p>
        </Reveal>

        <Reveal onMount delay={0.12}>
          <div className="mt-12">
            <LatestPlaying tracks={tracks} live={live} />
          </div>
        </Reveal>

        {contributions && (
          <Reveal onMount delay={0.18}>
            <div className="mt-12">
              <Contributions data={contributions} />
            </div>
          </Reveal>
        )}

        <Reveal onMount delay={0.24}>
          <div className="mt-14">
            <BuiltWith />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
