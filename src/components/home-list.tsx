"use client";

import { useState } from "react";
import Link from "next/link";
import { GrainGradient } from "@paper-design/shaders-react";
import type { HomeListItem } from "@/lib/data";

export function HomeList({ items }: { items: HomeListItem[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [center, setCenter] = useState(0);
  const active = hovered ? items.find((item) => item.id === hovered) : null;

  function track(el: HTMLElement, id: string) {
    setHovered(id);
    setCenter(el.offsetTop + el.offsetHeight / 2);
  }

  return (
    <div className="relative">
      <ul
        className="flex flex-col sm:w-1/2"
        onMouseLeave={() => setHovered(null)}
      >
        {items.map((item) => {
          const inner = (
            <>
              <span className="mt-1.5 h-3 w-3 shrink-0">
                {hovered === item.id && (
                  <GrainGradient
                    speed={2}
                    scale={2}
                    rotation={0}
                    offsetX={0}
                    offsetY={0}
                    softness={0}
                    intensity={0.15}
                    noise={0}
                    shape="blob"
                    frame={11386}
                    colors={["#3E6172", "#A49B74", "#568C50"]}
                    colorBack="#00000000"
                    className="h-full w-full rounded-full"
                  />
                )}
              </span>
              <span>
                <span className="block text-base text-foreground">
                  {item.title}
                </span>
                <span className="block text-sm text-muted">
                  {item.subtitle}
                </span>
              </span>
            </>
          );

          const cls = "flex items-start gap-2 py-3";

          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  {...(item.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                  onMouseEnter={(e) => track(e.currentTarget, item.id)}
                  onFocus={(e) => track(e.currentTarget, item.id)}
                  onBlur={() => setHovered(null)}
                  className={cls}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  onMouseEnter={(e) => track(e.currentTarget, item.id)}
                  className={cls}
                >
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div
        className={`pointer-events-none absolute right-0 hidden aspect-video w-[calc(50%-2rem)] -translate-y-1/2 overflow-hidden rounded-2xl shadow-ring transition-all duration-300 ease-out sm:block ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: center, backgroundImage: active?.preview }}
      />
    </div>
  );
}
