import Image from "next/image";
import { profile } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { LatestPlaying } from "@/components/latest-playing";
import { CommandMenu } from "@/components/command-menu";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-10 px-5 pb-24 sm:px-8">
      <Reveal>
        <div className="relative size-24 overflow-hidden rounded-full shadow-ring">
          <Image
            src="/images/pfp.png"
            alt={profile.name}
            fill
            sizes="96px"
            quality={90}
            className="object-cover object-top grayscale"
            priority
          />
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <p className="text-sm leading-relaxed text-muted">{profile.intro}</p>
      </Reveal>

      <Reveal delay={0.1}>
        <LatestPlaying />
      </Reveal>

      <Reveal delay={0.15}>
        <CommandMenu />
      </Reveal>
    </div>
  );
}
