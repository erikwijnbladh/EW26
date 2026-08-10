import { Suspense } from "react";
import { profile } from "@/lib/data";
import { PAGE_RAIL } from "@/lib/layout";
import { getContributions } from "@/lib/github";
import { Reveal } from "@/components/reveal";
import { PlayingSection, PlayingSkeleton } from "@/components/playing-section";
import { Contributions } from "@/components/contributions";
import { HomeList } from "@/components/home-list";
import { BuiltWith } from "@/components/built-with";

export default async function Home() {
  const contributions = await getContributions("erikwijnbladh");

  return (
    // One centred column, shared with the nav and About. Text carries `pl-5`
    // so it starts level with the name in the header; the list doesn't, because
    // its dot has to start level with the nav's dot, 20px to the left of it.
    <div className={`${PAGE_RAIL} pb-40 pt-4 sm:pb-44`}>
      <div>
        <Reveal onMount delay={0.06}>
          <div className="mt-8 pl-5">
            <h1 className="text-base font-normal text-foreground">
              Hello, I&apos;m Erik.
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {profile.intro}
            </p>
          </div>
        </Reveal>

        <Reveal onMount delay={0.12}>
          <div className="mt-12">
            <HomeList />
          </div>
        </Reveal>

        <Reveal onMount delay={0.18}>
          <div className="mt-12 pl-5">
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
            <div className="mt-12 pl-5">
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
