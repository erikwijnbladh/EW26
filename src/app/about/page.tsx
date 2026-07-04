import type { Metadata } from "next";
import Image from "next/image";
import { profile } from "@/lib/data";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { AboutLists } from "@/components/about-lists";

export const metadata: Metadata = {
  title: "about — erik wijnbladh",
  description: profile.tagline,
};

export default function About() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 sm:px-8 sm:pb-32">
      <section className="pb-12 pt-4 sm:pl-5">
        <Reveal>
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

      {/* One group so all paragraphs reveal together with a small stagger —
          per-paragraph whileInView made the last one wait until scrolled to. */}
      <RevealGroup className="flex flex-col gap-5 pl-5" stagger={0.05}>
        {profile.bio.map((paragraph, i) => (
          <RevealItem key={i}>
            <p className="max-w-xl text-base leading-relaxed text-muted">
              {paragraph}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>

      <AboutLists />
    </div>
  );
}
