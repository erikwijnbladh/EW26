import { Suspense } from "react";
import { contacts, profile } from "@/lib/data";
import { PAGE_RAIL } from "@/lib/layout";
import { getContributions } from "@/lib/github";
import { Reveal } from "@/components/reveal";
import { PlayingSection, PlayingSkeleton } from "@/components/playing-section";
import { Contributions } from "@/components/contributions";
import { Prose } from "@/components/mention";
import { BuiltWith } from "@/components/built-with";
import { Selection } from "@/components/night/selection";
import { Sky } from "@/components/night/sky";
import { SectionHead } from "@/components/night/stamp";
import { Strip } from "@/components/night/strip";
import { Career, Education } from "@/components/night/career";

/**
 * Night. One narrow column, read top to bottom: who, where (the sky over the
 * city, at its real hour), and then the sections, each franked with its own
 * stamp like a letter from home.
 */
export default async function Home() {
  const contributions = await getContributions("erikwijnbladh");

  return (
    <div className={`${PAGE_RAIL} pb-40 pt-6 sm:pb-44`}>
      <Reveal onMount>
        <section className="flex flex-col gap-4 text-[15px] leading-relaxed text-muted">
          <p>
            I&apos;m Erik, a{" "}
            <Selection>{profile.role.toLowerCase()}</Selection>{" "}
            in {profile.location.split(",")[0]}.
          </p>
          {profile.bio.slice(1).map((paragraph, i) => (
            <Prose key={i} text={paragraph} />
          ))}
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-foreground underline decoration-line underline-offset-4 transition-colors hover:decoration-foreground"
              >
                {c.label}
              </a>
            ))}
          </p>
        </section>
      </Reveal>

      <Reveal onMount delay={0.1}>
        <div className="-mx-5 mt-14 sm:-mx-16">
          <Sky />
        </div>
      </Reveal>

      <div className="mt-20 flex flex-col gap-20">
        <Reveal>
          <section>
            <SectionHead number={1} motif="crowns" tone="blue" title="Listening" />
            <Suspense fallback={<PlayingSkeleton />}>
              <PlayingSection />
            </Suspense>
          </section>
        </Reveal>

        <Reveal>
          <section>
            <SectionHead
              number={2}
              motif="wave"
              tone="sea"
              title="Away from the screen"
              aside="Scroll →"
            />
            <Strip />
          </section>
        </Reveal>

        <Reveal>
          <section>
            <SectionHead number={3} motif="pine" tone="green" title="Career" />
            <Career />
          </section>
        </Reveal>

        <Reveal>
          <section>
            <SectionHead number={4} motif="flake" tone="lingon" title="Studies" />
            <Education />
          </section>
        </Reveal>

        {contributions && (
          <Reveal>
            <section>
              <SectionHead number={5} motif="sun" tone="red" title="Commits" />
              <Contributions data={contributions} />
            </section>
          </Reveal>
        )}
      </div>

      <Reveal>
        <div className="mt-24">
          <BuiltWith />
        </div>
      </Reveal>
    </div>
  );
}
