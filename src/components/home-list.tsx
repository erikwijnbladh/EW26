"use client";

import { useState } from "react";
import Link from "next/link";
import { useSwoop, DotSpacer } from "@/components/use-swoop";
import { work, type Work } from "@/lib/data";

export function HomeList({ items = work }: { items?: Work[] }) {
  const { containerRef, dot, rowProps, release, hovered, top } = useSwoop();

  const active = hovered ? items.find((item) => item.id === hovered) : null;

  // The preview panel parks at the last hovered row and only fades out — it
  // must NOT follow the blob back up to its origin, which would make the
  // fading rectangle swoop away with the dot. So its position freezes whenever
  // nothing is hovered.
  //
  // Held in state and adjusted during render rather than in a ref: a ref
  // written while rendering is torn by concurrent React, which is free to
  // render a tree it then throws away — the parked position would be updated
  // by a pass that never painted. This is React's documented pattern for
  // deriving state from a changing input, and it re-renders immediately
  // without a wasted commit.
  const [center, setCenter] = useState(0);
  if (active && top !== center) setCenter(top);

  return (
    <div ref={containerRef} className="relative">
      {dot}

      <ul
        className="flex flex-col sm:w-1/2"
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") release();
        }}
      >
        {items.map((item) => {
          const inner = (
            <>
              <DotSpacer />
              <span>
                <span className="block text-base text-foreground">
                  {item.title}
                </span>
                <span className="block text-sm text-muted">{item.blurb}</span>
              </span>
            </>
          );

          const cls = "flex items-start gap-2 py-3";

          return (
            <li key={item.id}>
              {/* A project with a case page opens it; one without falls back
                  to its repo; employment rows aren't links at all. */}
              {item.page ? (
                <Link href={`/${item.id}`} {...rowProps(item.id)} className={cls}>
                  {inner}
                </Link>
              ) : item.href ? (
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  {...rowProps(item.id)}
                  className={cls}
                >
                  {inner}
                </Link>
              ) : (
                <div {...rowProps(item.id)} className={cls}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div
        className={`pointer-events-none absolute right-0 hidden aspect-video w-[calc(50%-2rem)] -translate-y-1/2 items-center justify-center overflow-hidden rounded-2xl bg-surface shadow-ring transition-all duration-300 ease-out sm:flex ${
          active?.media ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: center }}
      >
        {active?.media?.type === "video" ? (
          <video
            key={active.id}
            aria-label={active.media.alt}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          >
            <source src={`${active.media.src}.webm`} type="video/webm" />
            <source src={`${active.media.src}.mp4`} type="video/mp4" />
          </video>
        ) : active?.media?.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.media.src}
            alt={active.media.alt}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}
