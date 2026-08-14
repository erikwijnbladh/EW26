"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

const PANEL_GAP = 8;
const BAR_HEIGHT = 52;
const TAB_WIDTH = 36;
const BAR_GAP = 4;
const BAR_PADDING = 8;

export type ExpandableTabsItem = {
  id: string;
  label: string;
  icon: ReactNode;
  content?: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
};

export type ExpandableTabsClassNames = {
  root?: string;
  panel?: string;
  bar?: string;
  tab?: string;
  activeTab?: string;
  icon?: string;
  label?: string;
  pill?: string;
};

export interface ExpandableTabsProps {
  items: ExpandableTabsItem[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string | null) => void;
  className?: string;
  classNames?: ExpandableTabsClassNames;
}

type Size = { width: number; height: number };

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function sameSizes(a: Record<string, Size>, b: Record<string, Size>) {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) => a[key]?.width === b[key]?.width && a[key]?.height === b[key]?.height,
    )
  );
}

/** Measure each panel without letting one panel's height distort the other. */
function usePanelSizes(items: ExpandableTabsItem[]) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [sizes, setSizes] = useState<Record<string, Size>>({});

  const setRef = useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      refs.current[id] = node;
    },
    [],
  );

  const measure = useCallback(() => {
    const next: Record<string, Size> = {};

    for (const item of items) {
      const node = refs.current[item.id];
      if (!node) continue;
      next[item.id] = { width: node.offsetWidth, height: node.offsetHeight };
    }

    setSizes((current) => (sameSizes(current, next) ? current : next));
  }, [items]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    Object.values(refs.current).forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [measure]);

  return { setRef, sizes };
}

/**
 * A stable toolbar and one panel above it.
 *
 * The previous component animated width, height, labels, blur and two panel
 * opacities on separate springs. The toolbar now stays put. Opening is a short
 * bottom-up clip, and switching panels is a left-to-right redraw inside the
 * same frame. Nothing shifts under the pointer and no blur is used to hide a
 * double exposure.
 */
export function ExpandableTabs({
  items,
  value,
  defaultValue = null,
  onValueChange,
  className,
  classNames,
}: ExpandableTabsProps) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const activeId = controlled ? value : internal;
  const panels = items.filter((item) => item.content);
  const active = panels.find((item) => item.id === activeId) ?? null;
  const { setRef, sizes } = usePanelSizes(panels);

  const [shownId, setShownId] = useState<string | null>(
    active?.id ?? panels[0]?.id ?? null,
  );
  if (active && shownId !== active.id) setShownId(active.id);

  const setActive = useCallback(
    (next: string | null) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  useEffect(() => {
    if (!active) return;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setActive(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [active, setActive]);

  const toolbarWidth =
    items.length * TAB_WIDTH +
    Math.max(0, items.length - 1) * BAR_GAP +
    BAR_PADDING * 2;

  const panelSize = panels.reduce(
    (largest, item) => {
      const measured = sizes[item.id];
      return measured
        ? {
            width: Math.max(largest.width, measured.width),
            height: Math.max(largest.height, measured.height),
          }
        : largest;
    },
    { width: toolbarWidth, height: 0 },
  );

  const panelReady = panelSize.height > 0;
  const panelOpen = Boolean(active && panelReady);

  return (
    <div
      ref={rootRef}
      className={cn("relative pointer-events-none", className)}
      style={{
        width: panelSize.width,
        height: panelSize.height + PANEL_GAP + BAR_HEIGHT,
      }}
    >
      <motion.div
        aria-hidden={!panelOpen}
        initial={false}
        animate={{
          opacity: panelOpen ? 1 : 0,
          clipPath: panelOpen
            ? "inset(0% 0% 0% 0% round 20px)"
            : "inset(100% 0% 0% 0% round 20px)",
        }}
        transition={
          reduce
            ? { duration: 0 }
            : {
                duration: panelOpen ? 0.24 : 0.18,
                ease: panelOpen ? EASE_IN_OUT : EASE_OUT,
              }
        }
        className={cn(
          "dock-panel absolute inset-x-0 top-0 grid overflow-hidden",
          panelOpen ? "pointer-events-auto" : "pointer-events-none",
          classNames?.panel,
        )}
        style={{ height: panelSize.height }}
      >
        {panels.map((item) => {
          const current = item.id === shownId;
          return (
            <motion.div
              key={item.id}
              inert={!panelOpen || !current}
              initial={false}
              animate={{
                opacity: current ? 1 : 0,
                clipPath: current
                  ? "inset(0% 0% 0% 0%)"
                  : "inset(0% 100% 0% 0%)",
              }}
              transition={
                reduce
                  ? { duration: 0 }
                  : current
                    ? { duration: 0.22, delay: 0.035, ease: EASE_IN_OUT }
                    : { duration: 0.14, ease: EASE_OUT }
              }
              className="col-start-1 row-start-1 h-full min-h-0 w-full"
            >
              {item.content}
            </motion.div>
          );
        })}
      </motion.div>

      <div
        role="tablist"
        aria-label="Contact and navigation"
        aria-orientation="horizontal"
        className={cn(
          "dock pointer-events-auto absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-1 p-2",
          classNames?.root,
          classNames?.bar,
        )}
        style={{ height: BAR_HEIGHT, width: toolbarWidth }}
      >
        {items.map((item) => {
          const isPanel = Boolean(item.content);
          const isActive = isPanel && item.id === active?.id;
          const baseClass = cn(
            "relative isolate grid size-9 shrink-0 place-items-center rounded-full text-muted outline-none",
            "transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "focus-visible:ring-1 focus-visible:ring-foreground/35",
            "active:scale-[0.96] motion-reduce:active:scale-100",
            isActive && "text-foreground",
            classNames?.tab,
            isActive && classNames?.activeTab,
          );

          const icon = (
            <>
              {isActive && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 -z-10 rounded-full bg-foreground/[0.07] shadow-[inset_0_0_0_0.5px_var(--line)]",
                    classNames?.pill,
                  )}
                />
              )}
              <span className={cn("grid place-items-center", classNames?.icon)}>
                {item.icon}
              </span>
            </>
          );

          if (item.href) {
            return (
              <a
                key={item.id}
                href={item.href}
                aria-label={item.label}
                className={baseClass}
                {...(item.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {icon}
              </a>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              role={isPanel ? "tab" : undefined}
              aria-selected={isPanel ? isActive : undefined}
              aria-label={item.label}
              className={baseClass}
              onClick={
                isPanel
                  ? () => setActive(isActive ? null : item.id)
                  : item.onClick
              }
            >
              {icon}
            </button>
          );
        })}
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 -z-10 grid w-max items-start opacity-0"
      >
        {panels.map((item) => (
          <div
            key={item.id}
            ref={setRef(item.id)}
            className="col-start-1 row-start-1 w-max"
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
