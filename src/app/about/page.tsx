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
      <section className="pb-12 pt-4 pl-5">
        <Reveal>
          <TiltPhoto
            src="/images/pfp.png"
            alt={profile.name}
            className="w-full max-w-xl"
          />
        </Reveal>
      </section>

      <section className="flex flex-col gap-5 pl-5">
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
