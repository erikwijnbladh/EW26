"use client";

import { useState } from "react";
import Link from "next/link";
import type { HomeListItem } from "@/lib/data";

export function HomeList({ items }: { items: HomeListItem[] }) {
  const [hovered, setHovered] = useState<string>(items[0]?.id);
  const active = items.find((item) => item.id === hovered) ?? items[0];

  return (
    <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:items-start sm:gap-12">
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
                onFocus={() => setHovered(item.id)}
                className="group flex items-start gap-2 py-3"
              >
                <span
                  className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                    item.current ? "bg-blue-500" : "bg-transparent"
                  }`}
                />
                <span>
                  <span className="block text-base text-foreground transition-colors group-hover:text-foreground">
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
        className="sticky top-24 hidden aspect-video w-full overflow-hidden rounded-2xl border border-line shadow-sm transition-[background] duration-300 sm:block"
        style={{ backgroundImage: active?.preview }}
      />
    </div>
  );
}
