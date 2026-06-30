"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { DitherDot } from "@/components/dither-dot";
import { useIndicator } from "@/components/indicator-context";
import type { HomeListItem } from "@/lib/data";

const RETURN_DELAY = 3000; // wait after release before swooping back up
const SWOOP_MS = 700; // matches the transition duration below

export function HomeList({ items }: { items: HomeListItem[] }) {
  const { traveling, setTraveling } = useIndicator();
  const [hovered, setHovered] = useState<string | null>(null);
  const [center, setCenter] = useState(0); // preview panel (page-relative)
  const [left, setLeft] = useState(0); // indicator x (viewport)
  const [top, setTop] = useState(0); // indicator y (viewport)
  const [ready, setReady] = useState(false);
  const [armed, setArmed] = useState(false);

  const listRef = useRef<HTMLUListElement>(null);
  const originRef = useRef(0);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = hovered ? items.find((item) => item.id === hovered) : null;

  // Measure the origin (the resting nav indicator) and the left edge.
  useEffect(() => {
    function measure() {
      const anchor = document.getElementById("nav-indicator");
      const list = listRef.current;
      if (anchor) originRef.current = anchor.getBoundingClientRect().top;
      if (list) setLeft(list.getBoundingClientRect().left);
      if (!hovered) setTop(originRef.current);
      setReady(true);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [hovered]);

  // Arm the swoop transition after the first positioned frame.
  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, [ready]);

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
    setCenter(el.offsetTop + el.offsetHeight / 2);
    // Bullet sits at the row top + py-3 (12px) + mt-1.5 (6px).
    setTop(el.getBoundingClientRect().top + 18);
  }

  function release() {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    returnTimer.current = setTimeout(() => {
      setHovered(null); // measure effect swoops it back to the origin
      settleTimer.current = setTimeout(() => setTraveling(false), SWOOP_MS);
    }, RETURN_DELAY);
  }

  return (
    <div className="relative">
      <ul
        ref={listRef}
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

      {/* Floating indicator that travels from the name to the active row and
          back. Portaled to <body> so `fixed` resolves against the viewport,
          not the transformed page-transition wrapper. It crossfades with the
          resting indicator in the nav, which handles the parked state. */}
      {ready &&
        createPortal(
          <div
            className={`pointer-events-none fixed z-50 h-3 w-3 transition-opacity duration-200 ${
              traveling ? "opacity-100" : "opacity-0"
            } ${armed ? "[transition:top_700ms_ease-in-out,opacity_200ms]" : ""}`}
            style={{ top, left }}
          >
            <DitherDot />
          </div>,
          document.body,
        )}

      <div
        className={`pointer-events-none absolute right-0 hidden aspect-video w-[calc(50%-2rem)] -translate-y-1/2 overflow-hidden rounded-2xl shadow-ring transition-all duration-300 ease-out sm:block ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: center, backgroundImage: active?.preview }}
      />
    </div>
  );
}
