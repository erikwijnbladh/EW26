import type { Metadata } from "next";
import Image from "next/image";
import { profile } from "@/lib/data";
import { PAGE_RAIL } from "@/lib/layout";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { AboutLists } from "@/components/about-lists";

export const metadata: Metadata = {
  title: "About — Erik Wijnbladh",
  description: profile.tagline,
};

export default function About() {
  return (
    <div className={`${PAGE_RAIL} pb-40 sm:pb-44`}>
      <section className="pb-12 pt-4 pl-5">
        <Reveal>
          <div className="relative aspect-[7/6] w-full overflow-hidden rounded-2xl shadow-ring">
            <Image
              src="/images/pfp.png"
              alt={profile.name}
              fill
              sizes="(max-width: 640px) 90vw, 516px"
              quality={90}
              className="object-cover object-top grayscale"
              priority
            />
          </div>
        </Reveal>
      </section>

      {/* One group so all paragraphs reveal together with a small stagger —
          per-paragraph whileInView made the last one wait until scrolled to. */}
      <RevealGroup className="flex flex-col gap-5 pl-5" stagger={0.05}>
        {profile.bio.map((paragraph, i) => (
          <RevealItem key={i}>
            <p className="text-base leading-relaxed text-muted">
              {paragraph}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>

      <AboutLists />
    </div>
  );
}
