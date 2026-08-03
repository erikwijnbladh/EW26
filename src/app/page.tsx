import { Suspense } from "react";
import Image from "next/image";
import { profile } from "@/lib/data";
import { getContributions } from "@/lib/github";
import { Reveal } from "@/components/reveal";
import { PlayingSection, PlayingSkeleton } from "@/components/playing-section";
import { Contributions } from "@/components/contributions";
import { HomeList } from "@/components/home-list";
import { BuiltWith } from "@/components/built-with";

export default async function Home() {
  const contributions = await getContributions("erikwijnbladh");

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
            <HomeList />
          </div>
        </Reveal>

        <Reveal onMount delay={0.18}>
          <div className="mt-12">
            {/* Inside the reveal, not around it: the reveal plays once, on the
                skeleton, and the tracks then swap in underneath it. Around it,
                the strip would animate in a second time when it streamed. */}
            <Suspense fallback={<PlayingSkeleton />}>
              <PlayingSection />
            </Suspense>
          </div>
        </Reveal>

        {contributions && (
          <Reveal onMount delay={0.24}>
            <div className="mt-12">
              <Contributions data={contributions} />
            </div>
          </Reveal>
        )}

        <Reveal onMount delay={0.3}>
          <div className="mt-14">
            <BuiltWith />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
