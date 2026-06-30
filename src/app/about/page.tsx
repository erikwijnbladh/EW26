import type { Metadata } from "next";
import { profile, work } from "@/lib/data";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { TiltPhoto } from "@/components/tilt-photo";

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
          <h1 className="text-3xl tracking-tight sm:text-4xl">
            {profile.name}
          </h1>
          <p className="mt-2 font-serif text-xl italic text-muted">
            {profile.role}, {profile.location}
          </p>
        </Reveal>
      </section>

      <section className="flex flex-col gap-5 border-t border-line pt-10">
        {profile.bio.map((paragraph, i) => (
          <Reveal key={i} delay={i * 0.05}>
            <p className="max-w-xl text-base leading-relaxed text-muted">
              {paragraph}
            </p>
          </Reveal>
        ))}
      </section>

      <section className="mt-16 border-t border-line pt-10">
        <Reveal>
          <p className="text-sm text-muted">
            Reach me directly at{" "}
            <a
              href={`mailto:${profile.email}`}
              className="text-foreground underline decoration-line underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {profile.email}
            </a>{" "}
            or find me elsewhere:
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <ul className="mt-4 flex flex-wrap gap-2">
            {profile.social.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-line px-4 py-1.5 text-sm transition-colors duration-300 hover:bg-surface"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="mt-16 border-t border-line pt-10">
        <Reveal>
          <h2 className="font-serif text-2xl italic text-muted">
            Experience
          </h2>
        </Reveal>
        <RevealGroup className="mt-6 flex flex-col">
          {work.map((item) => (
            <RevealItem key={item.org}>
              <div className="flex flex-col gap-1 border-t border-line py-4 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="font-mono text-xs text-muted sm:w-32 sm:shrink-0">
                  {item.period}
                </span>
                <p className="text-base">
                  <span className="text-muted">{item.org}</span>{" "}
                  <span className="font-medium">{item.role}</span>
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </div>
  );
}
