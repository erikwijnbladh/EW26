"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DitherDot } from "@/components/dither-dot";
import { useIndicator } from "@/components/indicator-context";

const RETURN_DELAY = 3000; // wait after release before swooping back up
const SWOOP_MS = 220; // swoop duration (kept in sync with the transition below)
// Distance from a row's top to the bullet: py-3 (12px) + mt-1.5 (6px). Lines
// the bullet up with the first line of a row's title.
export const TITLE_OFFSET = 18;

/**
 * Shared "swooping dither dot" behaviour. The dot lives `absolute` inside a
 * `relative` container (so it scrolls in lockstep with its rows and never
 * drifts during iOS overscroll) and swoops from the nav "home" dot down to the
 * hovered row and back. Mouse-only — touch can't hover.
 */
export function useSwoop() {
  const { traveling, setTraveling } = useIndicator();
  const [hovered, setHovered] = useState<string | null>(null);
  const [top, setTop] = useState(0); // dot y (container-relative)
  const [armed, setArmed] = useState(false);
  const pathname = usePathname();

  const containerRef = useRef<HTMLDivElement>(null);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The nav "home" dot in this container's coordinate space. The nav is fixed,
  // so subtracting the container's current viewport top gives the swoop origin.
  function originTop() {
    const navDot = document.getElementById("nav-indicator");
    const container = containerRef.current;
    if (!navDot || !container) return TITLE_OFFSET;
    const n = navDot.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    return n.top + n.height / 2 - c.top - 6; // 6 = half the 12px bullet
  }

  // Park at the nav origin before first paint so the opening swoop starts from
  // the name, not from the top of the container.
  useEffect(() => {
    setTop(originTop());
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On navigation, spring the dot back up to the nav origin and clear any
  // in-flight hover/return so it doesn't linger on the new page.
  useEffect(() => {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    setHovered(null);
    setTop(originTop());
    setTraveling(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
    // offsetTop is relative to the (positioned) container, so it lives in the
    // same scroll space as the rows and never shifts during overscroll.
    setTop(el.offsetTop + TITLE_OFFSET);
  }

  function returnToOrigin() {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    setHovered(null);
    setTop(originTop());
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

  // Let the nav name pull the dot home immediately.
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

  /** Pointer handlers for a hoverable row (mouse only). */
  function rowProps(id: string) {
    return {
      onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
        if (e.pointerType === "mouse") hover(e.currentTarget, id);
      },
      onFocus: (e: React.FocusEvent<HTMLElement>) => hover(e.currentTarget, id),
      onBlur: release,
    };
  }

  /** The swooping dot. Render it as the first child of the container. */
  const dot = (
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
  );

  return { containerRef, dot, rowProps, release, hovered, top };
}

/** Leading spacer that reserves room for the dot and aligns the title. */
export function DotSpacer() {
  return <span className="mt-1.5 h-3 w-3 shrink-0" />;
}
