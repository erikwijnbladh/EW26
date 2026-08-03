"use client";

import Link from "next/link";
import { DitherDot } from "@/components/dither-dot";
import { useIndicator } from "@/components/indicator-context";

export function Nav() {
  const { traveling } = useIndicator();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="mx-auto w-full max-w-md px-5">
        <div className="flex h-16 items-center gap-2">
          {/* Resting indicator — a real child of the (fixed) nav so it stays
              glued to the name during iOS overscroll. Hidden while the
              floating indicator is traveling. */}
          <span
            id="nav-indicator"
            className={`h-3 w-3 shrink-0 transition-opacity duration-200 ${
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
    </header>
  );
}
