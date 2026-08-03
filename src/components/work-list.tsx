"use client";

import { useState } from "react";
import { work } from "@/lib/data";

/**
 * Selected work. Rows are monochrome type; opening one is the only moment
 * colour appears on the page, and it arrives as the artifact itself — a
 * recording or a screenshot — never as a treatment applied to it.
 *
 * Open/closed rather than hover: the artifact is a video, and a clip that
 * starts and stops as the pointer crosses a row is unreadable. It also gives
 * touch and keyboard the same interaction the pointer gets instead of a
 * second-class fallback.
 */
export function WorkList() {
  const [open, setOpen] = useState<string | null>(work[0]?.id ?? null);

  return (
    <section aria-label="Selected work">
      <p className="label" style={{ margin: 0 }}>
        Selected work
      </p>

      <ul className="stack m-0 list-none p-0" style={{ marginTop: "var(--s3)" }}>
        {work.map((item) => {
          const isOpen = open === item.id;

          return (
            <li key={item.id} className="rule-t">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`work-${item.id}`}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="flex w-full items-baseline gap-[var(--s3)] bg-transparent px-0 text-left"
                style={{ paddingBlock: "var(--s3)", border: 0 }}
              >
                <span className="label shrink-0 tabular-nums" style={{ width: "5.5em" }}>
                  {item.year}
                </span>
                <span className="item flex-1">{item.title}</span>
                <span className="label shrink-0">{item.kind}</span>
              </button>

              <div
                id={`work-${item.id}`}
                hidden={!isOpen}
                style={{ paddingBottom: "var(--s4)" }}
              >
                <div className="flex flex-col gap-[var(--s3)] sm:flex-row sm:items-start">
                  <p
                    className="dim m-0 flex-1"
                    style={{ maxWidth: "44ch", lineHeight: 1.6 }}
                  >
                    {item.blurb}
                    {item.href && (
                      <>
                        {" "}
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-[color:var(--line)] underline-offset-4 transition-colors hover:decoration-current"
                          style={{ color: "var(--ink)" }}
                        >
                          Source →
                        </a>
                      </>
                    )}
                  </p>

                  <div
                    className="artifact w-full sm:w-[52%]"
                    style={{ aspectRatio: "16 / 10" }}
                  >
                    {item.media?.type === "video" ? (
                      <video
                        aria-label={item.media.alt}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      >
                        <source src={`${item.media.src}.webm`} type="video/webm" />
                        <source src={`${item.media.src}.mp4`} type="video/mp4" />
                      </video>
                    ) : item.media?.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.media.src}
                        alt={item.media.alt}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="label flex h-full w-full items-center justify-center">
                        no artifact yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
