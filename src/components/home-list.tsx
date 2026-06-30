"use client";

import { useRef } from "react";
import Link from "next/link";
import { useSwoop, DotSpacer } from "@/components/use-swoop";
import type { HomeListItem } from "@/lib/data";

export function HomeList({ items }: { items: HomeListItem[] }) {
  const { containerRef, dot, rowProps, release, hovered, top } = useSwoop();

  const active = hovered ? items.find((item) => item.id === hovered) : null;

  // The preview panel parks at the last hovered row and only fades out — it
  // must NOT follow the blob back up to its origin (which would make the
  // fading rectangle swoop away with the dot). So we freeze its position
  // whenever nothing is hovered.
  const panelTop = useRef(0);
  if (active) panelTop.current = top;
  const center = panelTop.current;

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
                {item.subtitle && (
                  <span className="block text-sm text-muted">
                    {item.subtitle}
                  </span>
                )}
              </span>
            </>
          );

          const cls = "flex items-start gap-2 py-3";

          return (
            <li key={item.id} className={item.separated ? "mt-10" : ""}>
              {item.href ? (
                <Link
                  href={item.href}
                  {...(item.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
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
        className={`pointer-events-none absolute right-0 hidden aspect-video w-[calc(50%-2rem)] -translate-y-1/2 overflow-hidden rounded-2xl shadow-ring transition-all duration-300 ease-out sm:block ${
          active?.preview ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: center, backgroundImage: active?.preview }}
      />
    </div>
  );
}
