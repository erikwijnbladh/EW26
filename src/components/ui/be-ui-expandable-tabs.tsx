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
  immersiveId?: string;
  immersiveBarId?: string;
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
 * A toolbar and one panel above it.
 *
 * Regular panels leave the compact toolbar untouched. An immersive panel can
 * take the bar over: its control moves to the edge while the remaining space
 * becomes a supplied interaction slot. Panel switching itself is immediate,
 * so forms never slide or crossfade.
 */
export function ExpandableTabs({
  items,
  immersiveId,
  immersiveBarId,
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
  const immersiveOpen = Boolean(immersiveId && active?.id === immersiveId);
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
  const closedInset = Math.max(0, (panelSize.width - toolbarWidth) / 2);
  const closedScale = panelSize.width > 0 ? toolbarWidth / panelSize.width : 1;

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
          transform: panelOpen ? "scale(1)" : "scale(0.985)",
        }}
        transition={
          reduce
            ? { duration: 0 }
            : {
                duration: panelOpen ? 0.16 : 0.12,
                ease: EASE_OUT,
              }
        }
        className={cn(
          "dock-panel absolute inset-x-0 top-0 grid overflow-hidden",
          panelOpen ? "pointer-events-auto" : "pointer-events-none",
          classNames?.panel,
        )}
        style={{ height: panelSize.height, transformOrigin: "bottom center" }}
      >
        {panels.map((item) => {
          const current = item.id === shownId;
          return (
            <div
              key={item.id}
              inert={!panelOpen || !current}
              aria-hidden={!current}
              className={cn(
                "col-start-1 row-start-1 h-full min-h-0 w-full",
                current ? "visible" : "invisible",
              )}
            >
              {item.content}
            </div>
          );
        })}
      </motion.div>

      <div
        role={immersiveOpen ? undefined : "tablist"}
        aria-label={immersiveOpen ? "Ask Erik" : "Contact and navigation"}
        aria-orientation={immersiveOpen ? undefined : "horizontal"}
        className={cn(
          "pointer-events-auto absolute inset-x-0 bottom-0 h-[52px]",
          classNames?.root,
          classNames?.bar,
        )}
      >
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            transform: immersiveOpen
              ? "scaleX(1)"
              : `scaleX(${closedScale})`,
          }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 0.2, ease: EASE_IN_OUT }
          }
          className="dock absolute inset-0"
        />

        {items.map((item, itemIndex) => {
          const isPanel = Boolean(item.content);
          const isActive = isPanel && item.id === active?.id;
          const isImmersiveControl = item.id === immersiveId;
          const itemLeft = BAR_PADDING + itemIndex * (TAB_WIDTH + BAR_GAP);
          const restingX = closedInset;
          const activeX = isImmersiveControl ? BAR_PADDING - itemLeft : restingX;
          const baseClass = cn(
            "group absolute top-2 isolate grid size-9 place-items-center rounded-full text-muted outline-none",
            "transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "focus-visible:ring-1 focus-visible:ring-foreground/35",
            isActive && "text-foreground",
            immersiveOpen && !isImmersiveControl && "pointer-events-none",
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
              <span
                className={cn(
                  "grid place-items-center transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-active:scale-[0.96] motion-reduce:group-active:scale-100",
                  classNames?.icon,
                )}
              >
                {item.icon}
              </span>
            </>
          );

          if (item.href) {
            return (
              <motion.a
                key={item.id}
                href={item.href}
                aria-label={item.label}
                aria-hidden={immersiveOpen}
                tabIndex={immersiveOpen ? -1 : undefined}
                initial={false}
                animate={{
                  opacity: immersiveOpen ? 0 : 1,
                  transform: `translateX(${restingX}px)`,
                }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: immersiveOpen ? 0.1 : 0.14, ease: EASE_OUT }
                }
                className={baseClass}
                style={{ left: itemLeft }}
                {...(item.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {icon}
              </motion.a>
            );
          }

          return (
            <motion.button
              key={item.id}
              type="button"
              role={isPanel && !immersiveOpen ? "tab" : undefined}
              aria-selected={isPanel && !immersiveOpen ? isActive : undefined}
              aria-label={
                immersiveOpen && isImmersiveControl
                  ? `Close ${item.label}`
                  : item.label
              }
              aria-hidden={immersiveOpen && !isImmersiveControl}
              tabIndex={immersiveOpen && !isImmersiveControl ? -1 : undefined}
              initial={false}
              animate={{
                opacity: immersiveOpen && !isImmersiveControl ? 0 : 1,
                transform: `translateX(${immersiveOpen ? activeX : restingX}px)`,
              }}
              transition={
                reduce
                  ? { duration: 0 }
                  : isImmersiveControl
                    ? { duration: 0.2, ease: EASE_IN_OUT }
                    : {
                        duration: immersiveOpen ? 0.1 : 0.14,
                        ease: EASE_OUT,
                      }
              }
              className={baseClass}
              style={{ left: itemLeft }}
              onClick={
                isPanel
                  ? () => setActive(isActive ? null : item.id)
                  : item.onClick
              }
            >
              {icon}
            </motion.button>
          );
        })}

        {immersiveBarId && (
          <motion.div
            id={immersiveBarId}
            inert={!immersiveOpen}
            aria-hidden={!immersiveOpen}
            initial={false}
            animate={{ opacity: immersiveOpen ? 1 : 0 }}
            transition={
              reduce
                ? { duration: 0 }
                : immersiveOpen
                  ? { duration: 0.12, delay: 0.07, ease: EASE_OUT }
                  : { duration: 0.08, ease: EASE_OUT }
            }
            className={cn(
              "absolute inset-y-2 left-12 right-2",
              immersiveOpen ? "pointer-events-auto" : "pointer-events-none",
            )}
          />
        )}
      </div>

      <div
        aria-hidden
        inert
        data-panel-measurement
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
