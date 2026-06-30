"use client";

import { useState } from "react";
import Link from "next/link";
import type { HomeListItem } from "@/lib/data";

export function HomeList({ items }: { items: HomeListItem[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = items.find((item) => item.id === hovered);

  return (
    <div className="relative">
      <ul className="flex flex-col">
        {items.map((item) => {
          const linkProps = item.external
            ? { href: item.href, target: "_blank", rel: "noreferrer" }
            : { href: item.href };
          return (
            <li key={item.id}>
              <Link
                {...linkProps}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(item.id)}
                onBlur={() => setHovered(null)}
                className="block py-3"
              >
                <span className="block text-base text-foreground">
                  {item.title}
                </span>
                <span className="block text-sm text-muted">
                  {item.subtitle}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div
        className={`pointer-events-none absolute right-0 top-0 hidden aspect-video w-64 -translate-y-4 translate-x-[calc(100%+2rem)] rounded-2xl border border-line shadow-lg transition-opacity duration-200 sm:block ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: active?.preview }}
      />
    </div>
  );
}
