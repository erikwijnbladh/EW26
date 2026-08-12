import { Suspense } from "react";
import Image from "next/image";
import { profile } from "@/lib/data";
import { PAGE_RAIL, PORTRAIT } from "@/lib/layout";
import { getContributions } from "@/lib/github";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { PlayingSection, PlayingSkeleton } from "@/components/playing-section";
import { Contributions } from "@/components/contributions";
import { Prose } from "@/components/mention";
import { BuiltWith } from "@/components/built-with";

export default async function Home() {
  const contributions = await getContributions("erikwijnbladh");

  return (
    // One centred column, shared with the nav. Text carries `pl-5` so it starts
    // level with the name in the header.
    <div className={`${PAGE_RAIL} pb-40 pt-4 sm:pb-44`}>
      <Reveal onMount>
        <div className="pl-5">
          {/* Square, because the source is. The old 7/6 box cropped a square
              photograph to a landscape one and then scaled it up to fill the
              column — losing the top and bottom of it to make it larger. */}
          <div
            className={`relative aspect-square ${PORTRAIT} overflow-hidden rounded-xl shadow-ring`}
          >
            <Image
              src="/images/pfp.png"
              alt={profile.name}
              fill
              sizes="240px"
              quality={90}
              className="object-cover object-top grayscale"
              priority
            />
          </div>
        </div>
      </Reveal>

      <RevealGroup className="mt-10 flex flex-col gap-5 pl-5" stagger={0.05}>
        {profile.bio.map((paragraph, i) => (
          <RevealItem key={i}>
            <Prose text={paragraph} />
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal onMount delay={0.06}>
        <div className="mt-14 pl-5">
          {/* Inside the reveal, not around it: the reveal plays once, on the
              skeleton, and the tracks then swap in underneath it. Around it,
              the strip would animate in a second time when it streamed. */}
          <Suspense fallback={<PlayingSkeleton />}>
            <PlayingSection />
          </Suspense>
        </div>
      </Reveal>

      {/* The photo deck is built and passing, but parked — `Elsewhere` and its
          images are still here, so putting it back is this block and its
          import. See src/components/elsewhere.tsx. */}

      {contributions && (
        <Reveal onMount delay={0.12}>
          <div className="mt-12 pl-5">
            <Contributions data={contributions} />
          </div>
        </Reveal>
      )}

      <Reveal onMount delay={0.18}>
        <div className="mt-14">
          <BuiltWith />
        </div>
      </Reveal>
    </div>
  );
}
