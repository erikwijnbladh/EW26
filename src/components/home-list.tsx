import Link from "next/link";
import type { HomeListItem } from "@/lib/data";

export function HomeList({ items }: { items: HomeListItem[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const linkProps = item.external
          ? { href: item.href, target: "_blank", rel: "noreferrer" }
          : { href: item.href };
        return (
          <li key={item.id}>
            <Link
              {...linkProps}
              className="group flex items-center justify-between gap-4 py-3"
            >
              <span>
                <span className="block text-base text-foreground">
                  {item.title}
                </span>
                <span className="block text-sm text-muted">
                  {item.subtitle}
                </span>
              </span>
              <span
                className="h-0 w-0 shrink-0 overflow-hidden rounded-lg opacity-0 transition-all duration-300 ease-out group-hover:h-12 group-hover:w-20 group-hover:opacity-100"
                style={{ backgroundImage: item.preview }}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
