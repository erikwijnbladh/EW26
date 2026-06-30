import type { Metadata } from "next";
import { work } from "@/lib/data";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Experience — Erik Wijnbladh",
};

export default function Experience() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-4 sm:px-8 sm:pb-32">
      <Reveal>
        <h1 className="font-serif text-2xl italic text-muted">Experience</h1>
      </Reveal>
      <RevealGroup className="mt-8 flex flex-col">
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
    </div>
  );
}
