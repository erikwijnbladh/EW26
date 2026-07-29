import Image from "next/image";
import { profile } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { LatestPlaying } from "@/components/latest-playing";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-md px-5 pb-40 pt-4 sm:pb-44">
      <section>
        <Reveal onMount>
          {/* 4:3 rather than 7:6 so a full-width photo doesn't grow the page
              and push the track list under the dock. */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-ring">
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
            <LatestPlaying />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
