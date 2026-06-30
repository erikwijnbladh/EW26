"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Dithering } from "@paper-design/shaders-react";
import type { HomeListItem } from "@/lib/data";

const RETURN_DELAY = 3000;

export function HomeList({ items }: { items: HomeListItem[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [center, setCenter] = useState(0); // preview panel (page-relative)
  const [left, setLeft] = useState(0); // indicator x (viewport)
  const [top, setTop] = useState(0); // indicator y (viewport)
  const [ready, setReady] = useState(false);
  const [armed, setArmed] = useState(false);

  const listRef = useRef<HTMLUListElement>(null);
  const originRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = hovered ? items.find((item) => item.id === hovered) : null;

  // Measure the origin (nav name) and left edge. When idle, park the
  // indicator at the origin so it appears to live beside the name.
  useEffect(() => {
    function measure() {
      const name = document.getElementById("nav-name");
      const list = listRef.current;
      if (name) {
        const r = name.getBoundingClientRect();
        originRef.current = r.top + r.height / 2 - 6;
      }
      if (list) setLeft(list.getBoundingClientRect().left);
      if (!hovered) setTop(originRef.current);
      setReady(true);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [hovered]);

  // Enable the swoop transition only after the first positioned frame, so
  // the indicator appears at the origin instantly instead of animating in.
  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, [ready]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function hover(el: HTMLElement, id: string) {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setHovered(id);
    setCenter(el.offsetTop + el.offsetHeight / 2);
    // Bullet sits at the row top + py-3 (12px) + mt-1.5 (6px).
    setTop(el.getBoundingClientRect().top + 18);
  }

  // After leaving, wait before letting the indicator swoop back up.
  function release() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHovered(null), RETURN_DELAY);
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

      {/* Single shader indicator that travels from the name down to the
          active row and back. Portaled to <body> so `fixed` resolves
          against the viewport, not the transformed page-transition wrapper. */}
      {ready &&
        createPortal(
          <div
            className={`pointer-events-none fixed z-50 h-3 w-3 ${
              armed ? "transition-[top] duration-700 ease-in-out" : ""
            }`}
            style={{ top, left }}
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
