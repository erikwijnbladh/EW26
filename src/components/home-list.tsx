"use client";

import { useState } from "react";
import Link from "next/link";
import { Dithering } from "@paper-design/shaders-react";
import type { HomeListItem } from "@/lib/data";

export function HomeList({ items }: { items: HomeListItem[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [center, setCenter] = useState(0);
  const [bulletTop, setBulletTop] = useState(0);
  const active = hovered ? items.find((item) => item.id === hovered) : null;

  function track(el: HTMLElement, id: string) {
    setHovered(id);
    setCenter(el.offsetTop + el.offsetHeight / 2);
    // Bullet sits at row top + py-3 (12px) + mt-1.5 (6px).
    setBulletTop(el.offsetTop + 18);
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
              {/* Spacer reserving room for the floating shader bullet. */}
              <span className="mt-1.5 h-3 w-3 shrink-0" />
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

      {/* One persistent shader that slides to the active row so it never
          restarts when moving between items. */}
      <div
        className={`pointer-events-none absolute left-0 h-3 w-3 transition-[top,opacity] duration-300 ease-out ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: bulletTop }}
      >
        <Dithering
          speed={2}
          shape="sphere"
          type="4x4"
          size={0.1}
          scale={1}
          colorBack="#00000000"
          colorFront="#15140f"
          className="h-full w-full rounded-full"
        />
      </div>

      <div
        className={`pointer-events-none absolute right-0 hidden aspect-video w-[calc(50%-2rem)] -translate-y-1/2 overflow-hidden rounded-2xl shadow-ring transition-all duration-300 ease-out sm:block ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: center, backgroundImage: active?.preview }}
      />
    </div>
  );
}
