import { profile } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { LocalTime } from "@/components/local-time";
import { LatestPlaying } from "@/components/latest-playing";

export default function Home() {
  return (
    <div className="w-full px-6 pb-44 pt-20 sm:px-20 sm:pt-28">
      <Reveal>
        <h1 className="max-w-[15ch] text-[clamp(2rem,5.5vw,3.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
          {profile.headline}
        </h1>
      </Reveal>

      <Reveal delay={0.06}>
        <p className="mt-8 max-w-[46ch] text-lg font-light leading-[1.75] text-muted sm:mt-10">
          {profile.intro}
          <br />
          <br />
          <LocalTime />
        </p>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="mt-14 max-w-sm sm:mt-16">
          <LatestPlaying />
        </div>
      </Reveal>
    </div>
  );
}
