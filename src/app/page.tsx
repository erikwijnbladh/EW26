import Image from "next/image";
import { profile } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { LatestPlaying } from "@/components/latest-playing";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-40 sm:px-8 sm:pb-44">
      <section className="pt-4 sm:pl-5">
        <Reveal>
          <div className="relative aspect-[7/6] w-full max-w-sm overflow-hidden rounded-2xl shadow-ring">
            <Image
              src="/images/pfp.png"
              alt={profile.name}
              fill
              sizes="(max-width: 640px) 90vw, 384px"
              quality={90}
              className="object-cover object-top grayscale"
              priority
            />
          </div>
        </Reveal>
      </section>

      <div className="sm:pl-5">
        <Reveal delay={0.06}>
          <p className="mt-8 max-w-md text-base leading-relaxed text-muted">
            {profile.intro}
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-12 max-w-sm">
            <LatestPlaying />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
