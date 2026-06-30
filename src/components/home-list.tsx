"use client";

import { useState } from "react";
import Link from "next/link";
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
          const linkProps = item.external
            ? { href: item.href, target: "_blank", rel: "noreferrer" }
            : { href: item.href };
          return (
            <li key={item.id}>
              <Link
                {...linkProps}
                onMouseEnter={(e) => track(e.currentTarget, item.id)}
                onFocus={(e) => track(e.currentTarget, item.id)}
                onBlur={() => setHovered(null)}
                className="flex items-start gap-2 py-3"
              >
                <span
                  className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                    hovered === item.id ? "bg-blue-500" : "bg-transparent"
                  }`}
                />
                <span>
                  <span className="block text-base text-foreground">
                    {item.title}
                  </span>
                  <span className="block text-sm text-muted">
                    {item.subtitle}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div
        className={`pointer-events-none absolute right-0 hidden aspect-video w-[calc(50%-2rem)] -translate-y-1/2 overflow-hidden rounded-2xl border border-line shadow-lg transition-all duration-300 ease-out sm:block ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: center, backgroundImage: active?.preview }}
      />
    </div>
  );
}
