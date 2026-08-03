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
    // The wide column the nav and About are built on. Everything that is text
    // gets `pl-5` so it starts level with the name in the header; the list
    // doesn't, because its dot has to start level with the nav's dot — which
    // is the 20px to the left of it.
    <div className="mx-auto w-full max-w-3xl px-5 pb-40 pt-4 sm:px-8 sm:pb-44">
      <section className="pl-5">
        <Reveal onMount>
          <div className="relative aspect-[7/6] w-full max-w-xl overflow-hidden rounded-2xl shadow-ring">
            <Image
              src="/images/pfp.png"
              alt={profile.name}
              fill
              sizes="(max-width: 640px) 90vw, 576px"
              quality={90}
              className="object-cover object-top grayscale"
              priority
            />
          </div>
        </Reveal>
      </section>

      <div>
        <Reveal onMount delay={0.06}>
          <p className="mt-8 max-w-xl pl-5 text-base leading-relaxed text-muted">
            {profile.intro}
          </p>
        </Reveal>

        <Reveal onMount delay={0.12}>
          <div className="mt-12">
            <HomeList />
          </div>
        </Reveal>

        <Reveal onMount delay={0.18}>
          <div className="mt-12 max-w-xl pl-5">
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
            <div className="mt-12 max-w-xl pl-5">
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
