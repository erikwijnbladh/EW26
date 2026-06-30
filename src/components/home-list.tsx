"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { DitherDot } from "@/components/dither-dot";
import { useIndicator } from "@/components/indicator-context";
import type { HomeListItem } from "@/lib/data";

const RETURN_DELAY = 3000; // wait after release before swooping back up
const SWOOP_MS = 220; // swoop duration (kept in sync with the transition below)
// Distance from a row's top to the bullet: py-3 (12px) + mt-1.5 (6px). This
// lines the bullet up with the first line of the title.
const TITLE_OFFSET = 18;

// Document-relative top of an element (immune to iOS overscroll, unlike
// getBoundingClientRect which moves while the page rubber-bands).
function docTop(el: HTMLElement) {
  return el.getBoundingClientRect().top + window.scrollY;
}

// Current scroll position clamped to the real scrollable range, so iOS
// overscroll (scrollY < 0 or past the bottom) is ignored.
function clampedScrollY() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return Math.min(Math.max(window.scrollY, 0), Math.max(max, 0));
}

export function HomeList({ items }: { items: HomeListItem[] }) {
  const { traveling, setTraveling } = useIndicator();
  const [hovered, setHovered] = useState<string | null>(null);
  const [center, setCenter] = useState(0); // preview panel (page-relative)
  const [left, setLeft] = useState(0); // indicator x (viewport)
  const [top, setTop] = useState(0); // indicator y (viewport)
  const [ready, setReady] = useState(false);
  const [armed, setArmed] = useState(false);
  const [tracking, setTracking] = useState(false); // disable top-anim while glued to a scrolling row

  const listRef = useRef<HTMLUListElement>(null);
  const originRef = useRef(0);
  const activeElRef = useRef<HTMLElement | null>(null); // hovered row, for scroll tracking
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = hovered ? items.find((item) => item.id === hovered) : null;

  // Keep the indicator glued to its target through scroll/resize. Positions
  // are derived from document-relative offsets minus a *clamped* scroll, so
  // the bullet stays level with the title and never drifts during iOS
  // rubber-band overscroll. When nothing is hovered it parks at the nav dot.
  useEffect(() => {
    function measure() {
      const anchor = document.getElementById("nav-indicator");
      const list = listRef.current;
      const scroll = clampedScrollY();
      if (anchor) {
        const r = anchor.getBoundingClientRect();
        // Nav is fixed, so its viewport top is constant; keep it as-is.
        originRef.current = r.top + r.height / 2 - 6;
      }
      if (list) setLeft(list.getBoundingClientRect().left);
      const el = activeElRef.current;
      if (hovered && el) {
        setTop(docTop(el) + TITLE_OFFSET - scroll); // level with the title line
      } else {
        setTop(originRef.current);
      }
      setReady(true);
    }
    function onScroll() {
      setTracking(true); // jump (no anim) so the bullet stays glued to the row
      measure();
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
    };
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
    activeElRef.current = el;
    setTracking(false); // animate the swoop into the row
    setTraveling(true);
    setHovered(id);
    // Preview panel centers on the title line, matching the bullet.
    setCenter(el.offsetTop + TITLE_OFFSET);
    setTop(docTop(el) + TITLE_OFFSET - clampedScrollY()); // level with the title line
  }

  // Swoop straight back to the name origin, no delay (used when the cursor
  // lands on the nav name).
  function returnToOrigin() {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    activeElRef.current = null;
    setTracking(false); // animate the swoop home
    setHovered(null);
    settleTimer.current = setTimeout(() => setTraveling(false), SWOOP_MS);
  }

  function release() {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    returnTimer.current = setTimeout(() => {
      activeElRef.current = null;
      setTracking(false); // animate the swoop home
      setHovered(null); // measure effect swoops it back to the origin
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
            } ${
              armed && !tracking
                ? "[transition:top_220ms_ease-out,opacity_200ms]"
                : "[transition:opacity_200ms]"
            }`}
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
