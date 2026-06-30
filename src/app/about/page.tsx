import type { Metadata } from "next";
import { profile } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { TiltPhoto } from "@/components/tilt-photo";
import { AboutLists } from "@/components/about-lists";

export const metadata: Metadata = {
  title: "About — Erik Wijnbladh",
  description: profile.tagline,
};

export default function About() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 sm:px-8 sm:pb-32">
      <section className="flex flex-col items-start gap-8 pb-16 pt-4 sm:flex-row sm:items-center sm:gap-10 sm:pb-24">
        <Reveal>
          <TiltPhoto src="/images/pfp.png" alt={profile.name} />
        </Reveal>
        <Reveal delay={0.05} className="flex-1">
          <h1 className="text-3xl lowercase tracking-tight sm:text-4xl">
            {profile.name}
          </h1>
          <p className="mt-2 font-serif text-xl italic lowercase text-muted">
            {profile.role}, {profile.location}
          </p>
        </Reveal>
      </section>

      <section className="flex flex-col gap-5 pt-10 pl-5">
        {profile.bio.map((paragraph, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <p className="max-w-xl text-base leading-relaxed text-muted">
              {paragraph}
            </p>
          </Reveal>
        ))}
      </section>

      <AboutLists />
    </div>
  );
}
