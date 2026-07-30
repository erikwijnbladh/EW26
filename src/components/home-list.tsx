"use client";

import { useState } from "react";
import Link from "next/link";
import { useSwoop, DotSpacer } from "@/components/use-swoop";
import { previewLogos } from "@/components/logos";
import { PostShader, hasPostShader } from "@/components/post-shader";
import type { HomeListItem } from "@/lib/data";

export function HomeList({ items }: { items: HomeListItem[] }) {
  const { containerRef, dot, rowProps, release, hovered, top } = useSwoop();

  const active = hovered ? items.find((item) => item.id === hovered) : null;

  /**
   * What the panel last showed, and where.
   *
   * The panel parks at the last hovered row and only fades out — it must NOT
   * follow the dot back up to its origin, which would make the fading
   * rectangle swoop away with it. And it must not blank its contents the
   * moment the pointer leaves, or the art disappears a beat before the box
   * has finished fading. Both are the same requirement: hold the last hovered
   * state until something replaces it.
   *
   * Adjusted during render rather than parked in a ref, which is the pattern
   * React documents for deriving state from a changing input. React re-runs
   * the component before painting, so the panel never shows the intermediate
   * value, and unlike a ref it doesn't read mutable state mid-render.
   */
  const [parked, setParked] = useState<{ id: string; top: number } | null>(null);

  if (active && (parked?.id !== active.id || parked?.top !== top)) {
    setParked({ id: active.id, top });
  }

  const center = parked?.top ?? 0;
  const shown = active ?? items.find((item) => item.id === parked?.id) ?? null;

  const ShownLogo = shown ? previewLogos[shown.id] : undefined;

  // Driven by `active`, not `shown` — the held contents must not also hold the
  // panel open.
  const visible = Boolean(
    active &&
      (active.video || active.shader || active.preview || previewLogos[active.id]),
  );

  return (
    <div ref={containerRef} className="relative">
      {dot}

      <ul
        className="flex flex-col"
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

      {/* Parked in the margin beside the column rather than inside it: the page
          is a 448px measure with a lot of empty page either side, and a 16:9
          panel doesn't fit next to a half-width list at that measure. Shown
          from xl up, which is the first breakpoint with room for the panel
          plus its gutter — below that the list stands on its own. */}
      <div
        className={`pointer-events-none absolute left-full ml-8 hidden aspect-video w-80 -translate-y-1/2 items-center justify-center overflow-hidden rounded-2xl shadow-ring transition-all duration-300 ease-out xl:flex ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          top: center,
          backgroundImage:
            shown?.video || ShownLogo || hasPostShader(shown?.shader)
              ? undefined
              : shown?.preview,
          backgroundColor: shown?.video || ShownLogo ? "#000000" : undefined,
        }}
      >
        {shown?.video ? (
          // Keyed on the source so switching rows mounts a fresh element and
          // restarts the clip, rather than resuming the previous one mid-way.
          <video
            key={shown.video}
            src={shown.video}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : ShownLogo ? (
          <ShownLogo className="h-1/3 w-auto" />
        ) : (
          <PostShader name={shown?.shader} className="h-full w-full" />
        )}
      </div>
    </div>
  );
}
