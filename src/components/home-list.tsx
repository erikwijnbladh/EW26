"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { DitherDot } from "@/components/dither-dot";
import { useIndicator } from "@/components/indicator-context";
import type { HomeListItem } from "@/lib/data";

const RETURN_DELAY = 3000; // wait after release before swooping back up
const SWOOP_MS = 220; // swoop duration (kept in sync with the transition below)
// Distance from a row's top to the bullet: py-3 (12px) + mt-1.5 (6px). This
// lines the bullet up with the first line of the title.
const TITLE_OFFSET = 18;

export function HomeList({ items }: { items: HomeListItem[] }) {
  const { traveling, setTraveling } = useIndicator();
  const [hovered, setHovered] = useState<string | null>(null);
  const [center, setCenter] = useState(0); // preview panel (container-relative)
  const [top, setTop] = useState(0); // indicator y (container-relative)
  const [armed, setArmed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = hovered ? items.find((item) => item.id === hovered) : null;

  // The nav "home" dot, in this container's coordinate space. The nav is fixed
  // so its viewport position is constant; subtracting the container's current
  // viewport top gives the swoop origin. Read fresh each swoop so it's correct
  // at any scroll offset.
  function originTop() {
    const navDot = document.getElementById("nav-indicator");
    const container = containerRef.current;
    if (!navDot || !container) return TITLE_OFFSET;
    const n = navDot.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    return n.top + n.height / 2 - c.top - 6; // 6 = half the 12px bullet
  }

  // Park the bullet at the nav origin before the first paint so the opening
  // swoop starts from the name, not from the top of the list.
  useEffect(() => {
    setTop(originTop());
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (returnTimer.current) clearTimeout(returnTimer.current);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  function hover(el: HTMLElement, id: string) {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    setTraveling(true);
    setHovered(id);
    // offsetTop is relative to the (positioned) list container, so it lives in
    // the same scroll space as the rows — it never shifts during scroll or
    // iOS rubber-band overscroll.
    setCenter(el.offsetTop + TITLE_OFFSET);
    setTop(el.offsetTop + TITLE_OFFSET);
  }

  // Swoop straight back to the resting position, no delay (used when the
  // cursor lands on the nav name).
  function returnToOrigin() {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    setHovered(null);
    setTop(originTop()); // swoop back up to the name
    settleTimer.current = setTimeout(() => setTraveling(false), SWOOP_MS);
  }

  function release() {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    returnTimer.current = setTimeout(() => {
      setHovered(null);
      setTop(originTop()); // swoop back up to the name
      settleTimer.current = setTimeout(() => setTraveling(false), SWOOP_MS);
    }, RETURN_DELAY);
  }

  // Let the nav name pull the indicator home immediately.
  useEffect(() => {
    const name = document.getElementById("nav-name");
    const dot = document.getElementById("nav-indicator");
    if (!name) return;
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") returnToOrigin();
    };
    name.addEventListener("pointerenter", onEnter);
    dot?.addEventListener("pointerenter", onEnter);
    return () => {
      name.removeEventListener("pointerenter", onEnter);
      dot?.removeEventListener("pointerenter", onEnter);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Floating indicator that swoops to the active row and back. It lives
          inside this (positioned) container, so it scrolls in lockstep with
          the rows and stays glued during iOS rubber-band overscroll. It
          crossfades with the resting indicator in the nav. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-0 z-10 h-3 w-3 ${
          traveling ? "opacity-100" : "opacity-0"
        } ${
          armed
            ? "[transition:top_220ms_ease-out,opacity_200ms]"
            : "[transition:opacity_200ms]"
        }`}
        style={{ top }}
      >
        <DitherDot />
      </div>

      <ul
        className="flex flex-col sm:w-1/2"
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") release();
        }}
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
            <li
              key={item.id}
              className={item.separated ? "mt-10" : ""}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  {...(item.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") hover(e.currentTarget, item.id);
                  }}
                  onFocus={(e) => hover(e.currentTarget, item.id)}
                  onBlur={release}
                  className={cls}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") hover(e.currentTarget, item.id);
                  }}
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
          active?.preview ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: center, backgroundImage: active?.preview }}
      />
    </div>
  );
}
