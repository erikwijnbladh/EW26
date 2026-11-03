import { Suspense } from "react";
import Image from "next/image";
import { profile } from "@/lib/data";
import { PAGE_RAIL } from "@/lib/layout";
import { getContributions } from "@/lib/github";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";
import { Contributions } from "@/components/contributions";
import { Prose } from "@/components/mention";
import { BuiltWith } from "@/components/built-with";
import { Elsewhere } from "@/components/elsewhere";
import { Craft, CRAFTS } from "@/components/craft";
import { TurntableSection, TurntableSkeleton } from "@/components/crafts/turntable-section";
import { Dial } from "@/components/crafts/dial";
import { Clock } from "@/components/crafts/clock";

const craft = (id: (typeof CRAFTS)[number]["id"]) => {
  const index = CRAFTS.findIndex((c) => c.id === id);
  return { ...CRAFTS[index], index: index + 1 };
};

/**
 * The workbench: a short introduction that stays put, and beside it the
 * things that are better played with than described. Every piece is built on
 * something real — the live Spotify player, the CV, the clock in Stockholm,
 * the GitHub calendar — so the toys are also the facts.
 */
export default async function Home() {
  const contributions = await getContributions("erikwijnbladh");

  return (
    <div className={`${PAGE_RAIL} pb-40 pt-4 sm:pb-44`}>
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
        <aside className="min-w-0 pl-5 lg:sticky lg:top-28 lg:self-start">
          <Reveal onMount>
            <div className="relative size-16 overflow-hidden rounded-2xl shadow-ring">
              <Image
                src="/images/pfp.png"
                alt={profile.name}
                fill
                sizes="64px"
                quality={90}
                className="object-cover object-top grayscale"
                priority
              />
            </div>
            <h1 className="mt-6 font-serif text-4xl leading-[1.05] tracking-tight text-foreground">
              {profile.role},
              <br />
              <span className="italic text-muted">making small things move.</span>
            </h1>
          </Reveal>

          <RevealGroup className="mt-6 flex flex-col gap-4" stagger={0.05}>
            {profile.bio.slice(1).map((paragraph, i) => (
              <RevealItem key={i}>
                <Prose text={paragraph} />
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal onMount delay={0.1}>
            <nav aria-label="On the bench" className="mt-10">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted/60">
                On the bench
              </p>
              <ol className="mt-3 flex flex-col">
                {CRAFTS.map((c, i) => (
                  <li key={c.id}>
                    <a
                      href={`#${c.id}`}
                      className="group flex items-baseline gap-3 border-b border-line py-2 text-sm transition-colors"
                    >
                      <span className="font-mono text-[11px] tabular-nums text-muted/50">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-foreground transition-transform duration-200 group-hover:translate-x-1">
                        {c.title}
                      </span>
                      <span className="ml-auto text-xs text-muted/60">{c.note}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>
        </aside>

        <section aria-label="Workbench" className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2">
          <Reveal onMount delay={0.05}>
            <Craft {...craft("turntable")}>
              <Suspense fallback={<TurntableSkeleton />}>
                <TurntableSection />
              </Suspense>
            </Craft>
          </Reveal>

          <Reveal onMount delay={0.12}>
            <Craft {...craft("dial")}>
              <Dial />
            </Craft>
          </Reveal>

          <Reveal className="sm:col-span-2">
            <Craft {...craft("deck")} surfaceClassName="px-5 pb-4 pt-5 sm:px-10">
              <Elsewhere />
            </Craft>
          </Reveal>

          <Reveal>
            <Craft {...craft("clock")}>
              <Clock />
            </Craft>
          </Reveal>

          {contributions && (
            <Reveal>
              <Craft
                {...craft("commits")}
                surfaceClassName="flex aspect-square flex-col justify-center p-6"
              >
                <Contributions data={contributions} recent={26} />
              </Craft>
            </Reveal>
          )}
        </section>
      </div>

      <Reveal>
        <div className="mt-24">
          <BuiltWith />
        </div>
      </Reveal>
    </div>
  );
}
