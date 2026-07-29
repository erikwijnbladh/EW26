"use client";

import Link from "next/link";
import { DitherDot } from "@/components/dither-dot";
import { useIndicator } from "@/components/indicator-context";

export function Nav() {
  const { traveling } = useIndicator();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-background/80 backdrop-blur-md">
      {/* Same container as the page body, so the name lines up with the
          column rather than sitting against a wider one. */}
      <div className="mx-auto w-full max-w-md px-5">
        <div className="flex h-16 items-center">
          {/* The name is what has to line up with the column, so the dot hangs
              off the outside of it rather than pushing it in. On phones that
              leaves it sitting in the 20px gutter, hence the tighter gap —
              4px out puts a 12px dot centred in the margin instead of flush
              against the screen edge. */}
          <div className="relative flex items-center">
            {/* Resting indicator — a real child of the (fixed) nav so it stays
                glued to the name during iOS overscroll. Hidden while the
                floating indicator is traveling. */}
            <span
              id="nav-indicator"
              className={`absolute right-full mr-1 h-3 w-3 shrink-0 transition-opacity duration-200 sm:mr-2 ${
                traveling ? "opacity-0" : "opacity-100"
              }`}
            >
              <DitherDot />
            </span>
            <Link
              href="/"
              id="nav-name"
              className="text-sm font-medium lowercase tracking-tight text-foreground"
            >
              Erik Wijnbladh
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
