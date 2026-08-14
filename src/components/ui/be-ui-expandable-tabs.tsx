"use client";

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
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
 *
 * 4. Every tab's content stays mounted, stacked, and the open one is chosen by
 *    opacity — there is no AnimatePresence here. Swapping tabs used to mount the
 *    new card at full opacity on its first frame (`initial={false}` cancelled
 *    the enter variant) while the old one spent 110ms fading out on top of it
 *    and sliding 8px down. Two near-identical forms double-exposed on each
 *    other, and the only thing actually moving was the card that was leaving.
 *
 * 5. The shell is measured per tab rather than once around all of them. The
 *    sizer stacked every card in one grid cell, so the open shell was the union
 *    of all of them — a box no card was the size of. Now the shell springs
 *    between one card's size and the next, which is what carries the swap:
 *    the container changes shape, and the cards themselves never travel.
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

/**
 * Must match the `gap-*` on the row below — the closed shell width is computed
 * from it, so a mismatch sizes the shell to something other than its contents
 * and `overflow-hidden` quietly trims the outermost icons.
 */
const BAR_GAP = 6;
const ROOT_BORDER = 2;
const ICON_W = 16;
const ACTIVE_LEFT_PAD = 10;
const ACTIVE_RIGHT_PAD = 16;
const LABEL_GAP = 7;
const PANEL_DOCK_GAP = 4;

/**
 * Swapping one open card for another. Opacity and blur only — no offset, no
 * scale. The travel is the shell reshaping around them; a card that also slides
 * is a second thing moving on a second curve, and between two cards this alike
 * it reads as one smeared form rather than two distinct ones.
 *
 * The arriving card is held back a frame or two so the two aren't both half
 * visible at once, which is what makes a straight cross-fade look muddy.
 */
const CARD_IN = { duration: 0.26, delay: 0.06, ease: EASE_OUT } as const;
const CARD_OUT = { duration: 0.16, ease: EASE_OUT } as const;

const INSTANT = { duration: 0 } as const;

function sameSize(a: Size | null | undefined, b: Size | null | undefined) {
  return a?.width === b?.width && a?.height === b?.height;
}

function sameSizes(a: Record<string, Size>, b: Record<string, Size>) {
  const aKeys = Object.keys(a);

  if (aKeys.length !== Object.keys(b).length) return false;

  return aKeys.every((key) => sameSize(a[key], b[key]));
}

function sameWidths(a: Record<string, number>, b: Record<string, number>) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => a[key] === b[key]);
}

/**
 * The size each tab's card wants, measured from a hidden copy of it.
 *
 * Per tab, not once around the lot: the shell has to be able to spring from one
 * card's size to the next, and a single measurement of all of them stacked can
 * only ever produce the union — a box that fits every card and matches none.
 */
function useContentSizes(items: ExpandableTabsItem[]) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [sizes, setSizes] = useState<Record<string, Size>>({});

  const setCellRef = useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      refs.current[id] = node;
    },
    [],
  );

  const measure = useCallback(() => {
    const next: Record<string, Size> = {};

    for (const item of items) {
      const node = refs.current[item.id];

      if (node) {
        next[item.id] = {
          width: node.offsetWidth,
          height: node.offsetHeight,
        };
      }
    }

    setSizes((current) => (sameSizes(current, next) ? current : next));
  }, [items]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);

    for (const item of items) {
      const node = refs.current[item.id];

      if (node) {
        observer.observe(node);
      }
    }

    return () => observer.disconnect();
  }, [items, measure]);

  return { setCellRef, sizes };
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
  const { setLabelMeasureRef, widths: labelWidths } = useLabelWidths(items);

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const activeId = controlled ? value : internal;
  const active =
    items.find((item) => item.id === activeId && item.content) ?? null;
  const tabs = items.filter((item) => item.content);
  const visualActiveId = active?.id ?? null;
  const { setCellRef, sizes } = useContentSizes(tabs);

  const isOpen = active !== null;

  /**
   * Which card is on show, and whether it should get there instantly.
   *
   * On close it stays on the last card rather than going blank — the shell
   * shrinks over it, and there is nothing behind it to see.
   *
   * Adjusted during render rather than in an effect. In an effect it trailed
   * the click by a commit, and the shell spent that commit springing toward the
   * size of the card it was leaving; React re-runs the component immediately on
   * a render-phase update, so this lands before anything is painted.
   *
   * `snap` records, at the moment the target changes, whether the card and the
   * shell's size should simply *be* at their new values instead of travelling
   * there — true for everything except a swap between two open cards. It has to
   * be decided here rather than derived afterwards: once `from` has moved on,
   * whether the shell was shut a moment ago is no longer knowable.
   *
   * Opening and closing are the shell's own spring, and a second animation
   * running underneath it shows the previously-open card dissolving inside a
   * box that is still growing.
   */
  const [shown, setShown] = useState({
    id: visualActiveId,
    from: visualActiveId,
    snap: true,
  });

  if (shown.from !== visualActiveId) {
    setShown({
      id: visualActiveId ?? shown.id,
      from: visualActiveId,
      snap: visualActiveId === null || shown.from === null,
    });
  }

  const renderedId = shown.id;
  const snap = shown.snap || Boolean(reduce);

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

  /**
   * One size, taken from the tallest card rather than from whichever is open.
   *
   * The cards are two views of the same object and there is no reason for the
   * shell to be a different shape in each — so it isn't. It takes the largest
   * each axis needs and the cards stretch to fill it, which also means swapping
   * tabs moves nothing at all: no reshape, because there is nothing to reshape
   * to.
   *
   * Still measured per card and maxed here rather than measured as one union
   * box, because that is what lets a card ask for a size the others don't have
   * to share — and it is per width, which a fixed number could not be. The gap
   * between these two is 17px on a desktop and 83px on a phone, where the name
   * and email fields stack.
   */
  const openSize = tabs.reduce(
    (largest, item) => {
      const measured = sizes[item.id];
      if (!measured) return largest;

      return {
        width: Math.max(largest.width, measured.width + ROOT_BORDER),
        height: Math.max(largest.height, measured.height + ROOT_BORDER),
      };
    },
    { ...closedSize },
  );

  // The one value everything else is a function of: 0 closed, 1 open.
  const progress = useMotionValue(0);

  useEffect(() => {
    if (reduce) {
      progress.set(isOpen ? 1 : 0);
      return;
    }

    const controls = animate(progress, isOpen ? 1 : 0, SHELL_SPRING);

    return () => controls.stop();
  }, [isOpen, reduce, progress]);

  /**
   * What the shell is opening *to*. Its own pair of values rather than a
   * constant, because swapping tabs changes the target while `progress` is
   * pinned at 1 — the open size has to be able to travel on its own.
   */
  const openW = useMotionValue(closedSize.width);
  const openH = useMotionValue(closedSize.height);

  useEffect(() => {
    if (snap) {
      openW.jump(openSize.width);
      openH.jump(openSize.height);
      return;
    }

    const w = animate(openW, openSize.width, SHELL_SPRING);
    const h = animate(openH, openSize.height, SHELL_SPRING);

    return () => {
      w.stop();
      h.stop();
    };
  }, [openSize.width, openSize.height, snap, openW, openH]);

  const between = (from: number, to: number, t: number) =>
    from + (to - from) * (t < 0 ? 0 : t > 1 ? 1 : t);

  const width = useTransform([progress, openW], ([p, w]: number[]) =>
    between(closedSize.width, w, p / WIDTH_LEAD),
  );
  const height = useTransform([progress, openH], ([p, h]: number[]) =>
    between(closedSize.height, h, p),
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
        {/* The padding rides on each cell rather than the grid around them, so
            what gets measured is one card plus the room the shell has to leave
            for it — the number the shell is actually animating to. */}
        <div
          aria-hidden
          className={cn(
            // `items-start`, because a grid stretches its children by default
            // and stacked cells share one row — without it every card measures
            // as tall as the tallest, which is the union this is here to avoid.
            "pointer-events-none invisible absolute left-0 top-0 grid w-max items-start",
            classNames?.panel,
          )}
        >
          {tabs.map((item) => (
            <div
              key={item.id}
              ref={setCellRef(item.id)}
              className="col-start-1 row-start-1 w-max px-2 pt-2"
              style={{ paddingBottom: BAR_H + PANEL_DOCK_GAP }}
            >
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
            style={{
              opacity: contentOpacity,
              filter: contentFilter,
              willChange: "opacity, filter",
            }}
            className={cn(
              "absolute inset-x-0 bottom-0 grid justify-items-center px-2",
              !isOpen && "pointer-events-none",
            )}
          >
            {/* Every card, stacked in one cell and sitting on the bottom edge,
                with opacity deciding which one you're looking at. Nothing
                mounts, unmounts or moves on a swap — so there is no moment
                where one card is being laid out and the other is being removed
                from the layout, which is where the old version got its lurch.

                Sat on the bottom because that edge doesn't move: the shell is
                docked there, so the top edge does all the travelling and the
                cards stay where they are while it passes over them. */}
            {tabs.map((item) => {
              const current = item.id === renderedId;

              return (
                <motion.div
                  key={item.id}
                  inert={!isOpen || !current}
                  // Stretched, not bottom-aligned: the shell is sized to the
                  // tallest card, so the others have slack to take up. Sitting
                  // on the bottom edge instead leaves it as a gap above them.
                  className="col-start-1 row-start-1 grid w-max"
                  initial={false}
                  animate={{
                    opacity: current ? 1 : 0,
                    filter: current ? "blur(0px)" : "blur(3px)",
                  }}
                  transition={snap ? INSTANT : current ? CARD_IN : CARD_OUT}
                >
                  {item.content}
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Sized to its contents and centred with a transform, rather than
            stretched to the shell and centred by flex.

            Stretched, the row's width was the shell's width — a spring mapped
            over the first 45% of the expansion — while the active tab widened
            on a second spring running the whole way. Centring divides the
            difference between them, so every icon's position was the average
            of two curves that finish at different times, re-rounded to a whole
            pixel each frame. That is what shakes.

            At `w-max` the row is only as wide as the icons, so the one thing
            moving them is the active tab's own width, and the centring happens
            in a transform — composited, sub-pixel, no per-frame rounding. */}
        <div
          role="tablist"
          aria-label="Navigation tabs"
          aria-orientation="horizontal"
          className={cn(
            "absolute bottom-0 left-1/2 z-20 flex w-max -translate-x-1/2 items-center gap-1.5 p-2",
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
                // No `layout` here on purpose. This button's width is already
                // animated below, and flex reflows its neighbours from that
                // width every frame. Adding layout projection animated the
                // same movement a second time, on its own curve — so the tab
                // and the icons beside it travelled on different timings and
                // visibly disagreed about where they were.
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
