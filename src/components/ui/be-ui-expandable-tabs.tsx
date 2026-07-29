"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from "motion/react";
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

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

export const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

export const SPRING_SWAP = {
  type: "spring",
  stiffness: 460,
  damping: 30,
  mass: 0.55,
} as const;

export const SPRING_PANEL = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.5,
} as const;

export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 360,
  damping: 32,
  mass: 0.6,
} as const;

export const SPRING_MOUSE = {
  stiffness: 200,
  damping: 15,
  mass: 0.3,
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * LOCAL MODIFICATIONS (diverges from upstream):
 *
 * 1. An item without `content` is an action, not a tab — same styling, hover
 *    and press feedback, but it never expands the shell or reveals a label.
 *    Lets one bar mix a single expanding tab with plain icon buttons.
 *
 * 2. The panel anchors its content bottom-centre instead of top-left. The
 *    shell grows from a centred, bottom-docked bar, so both its top and left
 *    edges move during the expansion; content pinned to those edges travels
 *    with them (measured: 350px up and 91px left over one open). Anchored to
 *    the fixed edges instead, the content doesn't move at all — the shell just
 *    uncovers it.
 *
 * 3. One spring drives the expansion, and the shell's size and the panel's
 *    reveal are both derived from it rather than animated alongside it.
 *    Upstream runs them as separate animations, which is invisible opening but
 *    obvious closing: the content's 80ms exit left the shell spending the
 *    remaining ~400ms of its collapse as a large empty box deflating. Derived,
 *    the content can only fade at the rate the shell actually swallows it.
 *
 *    Width is mapped over the first 45% of that spring so it leads the height.
 *    The shell reaches full width while it's still short, which means the panel
 *    is uncovered bottom-up at its final width — a curtain — instead of the
 *    content being clipped side-to-side on the way out of the bar.
 */
export type ExpandableTabsItem = {
  id: string;
  label: string;
  icon: ReactNode;
  /** Omit to make this a plain clickable icon instead of an expanding tab. */
  content?: ReactNode;
  /** Actions only. */
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

type Size = {
  width: number;
  height: number;
};

const SHELL_SPRING = {
  type: "spring",
  duration: 0.58,
  bounce: 0.06,
} as const;

/**
 * The pill and its label share the shell's timing so the three land together.
 * Only the label's opacity is quicker, and only on the way out — the text has
 * to be gone before the pill is narrow enough to clip it.
 */
const TAB_CHANGE_SPRING = SHELL_SPRING;

const LABEL_HIDE = {
  duration: 0.14,
  ease: EASE_OUT,
} as const;

/** Fraction of the shell's spring over which the width finishes. */
const WIDTH_LEAD = 0.45;

/** Where the panel's fade and blur finish, as a fraction of that spring. */
const CONTENT_FADE = 0.35;
const CONTENT_SHARPEN = 0.3;

const BAR_H = 52;
const TAB_W = 32;
const BAR_X = 16;
const BAR_GAP = 4;
const ROOT_BORDER = 2;
const ICON_W = 16;
const ACTIVE_LEFT_PAD = 10;
const ACTIVE_RIGHT_PAD = 16;
const LABEL_GAP = 7;
const PANEL_DOCK_GAP = 4;

const CONTENT_VARIANTS: Variants = {
  enter: {
    y: -8,
    scale: 0.98,
    opacity: 0,
    filter: "blur(4px)",
  },
  center: {
    y: 0,
    scale: 1,
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: {
    y: -6,
    scale: 0.98,
    opacity: 0,
    filter: "blur(4px)",
    transition: {
      duration: 0.08,
      ease: EASE_OUT,
    },
  },
};

const REDUCED_CONTENT_VARIANTS: Variants = {
  enter: {
    opacity: 0,
    filter: "blur(0px)",
  },
  center: {
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.08,
      ease: EASE_OUT,
    },
  },
};

const CONTENT_SPRING = {
  type: "spring",
  duration: 0.46,
  bounce: 0.08,
} as const;

function sameSize(a: Size | null | undefined, b: Size | null | undefined) {
  return a?.width === b?.width && a?.height === b?.height;
}

function sameWidths(a: Record<string, number>, b: Record<string, number>) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => a[key] === b[key]);
}

function useContentSize() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;

    if (!el) return;

    const next = {
      width: el.offsetWidth,
      height: el.offsetHeight,
    };

    setSize((current) => (sameSize(current, next) ? current : next));
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const el = ref.current;

    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);

    observer.observe(el);

    return () => observer.disconnect();
  }, [measure]);

  return [ref, size] as const;
}

function useLabelWidths(items: ExpandableTabsItem[]) {
  const refs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [widths, setWidths] = useState<Record<string, number>>({});

  const setLabelMeasureRef = useCallback(
    (id: string) => (node: HTMLSpanElement | null) => {
      refs.current[id] = node;
    },
    [],
  );

  const measure = useCallback(() => {
    const next: Record<string, number> = {};

    for (const item of items) {
      const node = refs.current[item.id];

      if (node) {
        next[item.id] = Math.ceil(node.offsetWidth);
      }
    }

    setWidths((current) => (sameWidths(current, next) ? current : next));
  }, [items]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);

    for (const item of items) {
      const node = refs.current[item.id];

      if (node) {
        observer.observe(node);
      }
    }

    return () => observer.disconnect();
  }, [items, measure]);

  return {
    setLabelMeasureRef,
    widths,
  };
}

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
  const [sizerRef, size] = useContentSize();
  const { setLabelMeasureRef, widths: labelWidths } = useLabelWidths(items);

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const activeId = controlled ? value : internal;
  const active =
    items.find((item) => item.id === activeId && item.content) ?? null;
  const tabs = items.filter((item) => item.content);
  const visualActiveId = active?.id ?? null;

  // The last tab to have been open stays mounted, clipped to nothing behind the
  // bar. Unmounting it on close is what left the shell deflating around empty
  // space; keeping it costs one hidden subtree, which the sizer already pays.
  const [renderedId, setRenderedId] = useState<string | null>(visualActiveId);
  const rendered =
    tabs.find((item) => item.id === renderedId) ?? null;

  useEffect(() => {
    if (visualActiveId) setRenderedId(visualActiveId);
  }, [visualActiveId]);

  const setActive = useCallback(
    (next: string | null) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  useEffect(() => {
    if (!visualActiveId) return;

    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setActive(null);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
      }
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [setActive, visualActiveId]);

  const closedSize = {
    width:
      items.length * TAB_W +
      Math.max(0, items.length - 1) * BAR_GAP +
      BAR_X +
      ROOT_BORDER,
    height: BAR_H + ROOT_BORDER,
  };

  const openSize = size
    ? {
        width: Math.max(size.width + ROOT_BORDER, closedSize.width),
        height: Math.max(size.height + ROOT_BORDER, closedSize.height),
      }
    : closedSize;

  // The one value everything else is a function of: 0 closed, 1 open.
  const isOpen = active !== null;
  const progress = useMotionValue(0);

  useEffect(() => {
    if (reduce) {
      progress.set(isOpen ? 1 : 0);
      return;
    }

    const controls = animate(progress, isOpen ? 1 : 0, SHELL_SPRING);

    return () => controls.stop();
  }, [isOpen, reduce, progress]);

  const width = useTransform(
    progress,
    [0, WIDTH_LEAD],
    [closedSize.width, openSize.width],
  );
  const height = useTransform(
    progress,
    [0, 1],
    [closedSize.height, openSize.height],
  );

  const contentOpacity = useTransform(progress, [0, CONTENT_FADE], [0, 1]);
  const contentBlurPx = useTransform(
    progress,
    [0, CONTENT_SHARPEN],
    [reduce ? 0 : 4, 0],
  );
  const contentFilter = useMotionTemplate`blur(${contentBlurPx}px)`;

  const getActiveTabWidth = useCallback(
    (item: ExpandableTabsItem) =>
      Math.max(
        TAB_W,
        ACTIVE_LEFT_PAD +
          ICON_W +
          LABEL_GAP +
          (labelWidths[item.id] ?? 0) +
          ACTIVE_RIGHT_PAD,
      ),
    [labelWidths],
  );

  return (
    <>
      <motion.div
        ref={rootRef}
        style={{ width, height }}
        className={cn(
          "relative overflow-hidden rounded-[26px] border border-border bg-card",
          className,
          classNames?.root,
        )}
      >
        <div
          ref={sizerRef}
          aria-hidden
          className={cn(
            "pointer-events-none invisible absolute left-0 top-0 grid w-max px-2 pt-2",
            classNames?.panel,
          )}
          style={{
            paddingBottom: BAR_H + PANEL_DOCK_GAP,
          }}
        >
          {tabs.map((item) => (
            <div key={item.id} className="col-start-1 row-start-1 w-max">
              {item.content}
            </div>
          ))}
        </div>

        <div
          className={cn(
            "absolute inset-x-0 top-0 z-10 overflow-hidden",
            classNames?.panel,
          )}
          style={{
            bottom: BAR_H + PANEL_DOCK_GAP,
          }}
        >
          {/* Absolutely pinned rather than flex-aligned: the content is taller
              than this box for most of the expansion, and an overflowing flex
              item falls back to start alignment, which puts it back on the
              moving edge. */}
          <motion.div
            inert={!isOpen}
            style={{
              opacity: contentOpacity,
              filter: contentFilter,
              willChange: "opacity, filter",
            }}
            className={cn(
              "absolute inset-x-0 bottom-0 flex justify-center px-2",
              !isOpen && "pointer-events-none",
            )}
          >
            {/* Only fires when swapping between two open tabs — opening and
                closing are the shell's job, not a mount/unmount. */}
            <AnimatePresence mode="popLayout" initial={false}>
              {rendered ? (
                <motion.div
                  key={rendered.id}
                  variants={
                    reduce ? REDUCED_CONTENT_VARIANTS : CONTENT_VARIANTS
                  }
                  initial={false}
                  animate="center"
                  exit="exit"
                  transition={
                    reduce
                      ? {
                          duration: 0.15,
                          ease: EASE_OUT,
                        }
                      : CONTENT_SPRING
                  }
                  className="w-max"
                  style={{ transformOrigin: "bottom center" }}
                >
                  {rendered.content}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>

        <div
          role="tablist"
          aria-label="Navigation tabs"
          aria-orientation="horizontal"
          className={cn(
            "absolute bottom-0 left-0 z-20 flex w-full items-center justify-between gap-1 p-2",
            classNames?.bar,
          )}
          style={{
            height: BAR_H,
          }}
        >
          {items.map((item) => {
            const isActive = item.id === visualActiveId;
            const activeTabWidth = getActiveTabWidth(item);
            const labelWidth = labelWidths[item.id] ?? 0;

            const baseClass = cn(
              "relative isolate flex h-9 min-w-8 shrink-0 items-center justify-center overflow-hidden rounded-[18px] px-2 text-sm font-medium outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "text-muted-foreground hover:text-foreground",
              classNames?.tab,
            );

            // Action: same chrome, no expansion, no label.
            if (!item.content) {
              const inner = (
                <span
                  className={cn(
                    "grid shrink-0 place-items-center",
                    classNames?.icon,
                  )}
                >
                  {item.icon}
                </span>
              );

              const shared = {
                className: baseClass,
                "aria-label": item.label,
                style: { width: TAB_W },
                whileTap: reduce ? undefined : { scale: 0.92 },
                transition: reduce ? { duration: 0 } : SPRING_PRESS,
              };

              return item.href ? (
                <motion.a
                  key={item.id}
                  {...shared}
                  href={item.href}
                  {...(item.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : null)}
                >
                  {inner}
                </motion.a>
              ) : (
                <motion.button
                  key={item.id}
                  {...shared}
                  type="button"
                  onClick={item.onClick}
                >
                  {inner}
                </motion.button>
              );
            }

            return (
              <motion.button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={item.label}
                onClick={() => setActive(isActive ? null : item.id)}
                layout={reduce ? false : "position"}
                animate={{
                  width: active && isActive ? activeTabWidth : TAB_W,
                }}
                transition={reduce ? { duration: 0 } : TAB_CHANGE_SPRING}
                className={cn(
                  "relative isolate flex h-9 min-w-8 shrink-0 items-center justify-center overflow-hidden rounded-[18px] px-2 text-sm font-medium outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active && isActive && "min-w-0 justify-start pl-2.5 pr-4",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  classNames?.tab,
                  isActive && classNames?.activeTab,
                )}
              >
                {isActive ? (
                  <span
                    className={cn(
                      "absolute inset-0 -z-10 rounded-[18px] bg-foreground/10",
                      classNames?.pill,
                    )}
                  />
                ) : null}

                <span
                  className={cn(
                    "grid shrink-0 place-items-center",
                    classNames?.icon,
                  )}
                >
                  {item.icon}
                </span>

                <motion.span
                  aria-hidden
                  initial={false}
                  animate={
                    reduce
                      ? {
                          width: isActive ? labelWidth : 0,
                          opacity: isActive ? 1 : 0,
                          marginLeft: isActive ? LABEL_GAP : 0,
                          filter: "blur(0px)",
                        }
                      : {
                          width: isActive ? labelWidth : 0,
                          opacity: isActive ? 1 : 0,
                          marginLeft: isActive ? LABEL_GAP : 0,
                          filter: isActive ? "blur(0px)" : "blur(3px)",
                        }
                  }
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          ...TAB_CHANGE_SPRING,
                          // Out before the pill is narrow enough to clip it.
                          ...(isActive ? null : { opacity: LABEL_HIDE }),
                        }
                  }
                  className={cn(
                    "inline-block overflow-hidden whitespace-nowrap",
                    classNames?.label,
                  )}
                >
                  {item.label}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 -z-10 flex opacity-0"
      >
        {items.map((item) => (
          <span
            key={item.id}
            ref={setLabelMeasureRef(item.id)}
            className={cn(
              "whitespace-nowrap text-sm font-medium leading-none",
              classNames?.label,
            )}
          >
            {item.label}
          </span>
        ))}
      </div>
    </>
  );
}
