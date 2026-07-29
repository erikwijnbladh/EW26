"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { profile, contacts } from "@/lib/data";
import {
  duration,
  ease,
  labelClose,
  labelOpen,
  springPanel,
  springShell,
  springSnappy,
  springSoft,
  springTab,
} from "@/lib/motion";
import { SayHiForm } from "@/components/say-hi";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * Strokes draw themselves on mount: opacity snaps in over 100ms while the
 * line unspools over 400ms, so it reads as being drawn rather than faded up.
 */
const draw = (delay = 0) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: {
    duration: 0.4,
    ease,
    delay,
    opacity: { duration: 0.1, delay },
  },
});

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <motion.rect
        x="2.5"
        y="5"
        width="19"
        height="14"
        rx="3.5"
        {...stroke}
        {...draw()}
      />
      <motion.path
        d="M3.5 7.5 10.9 12.6a2 2 0 0 0 2.2 0L20.5 7.5"
        {...stroke}
        {...draw(0.1)}
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <motion.path d="M4 12 9 17L20 6" {...stroke} {...draw()} />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path d="M10 20.567C6.571 21.725 3.714 20.567 2 17" {...stroke} />
      <path
        d="M10 22v-3.242a2.4 2.4 0 0 1 .48-1.588c.204-.322.064-.78-.303-.881C7.134 15.453 5 14.108 5 9.646c0-1.16.38-2.25 1.048-3.2.166-.236.249-.354.269-.461.02-.107-.014-.246-.084-.526a5.5 5.5 0 0 1 .16-3.431s.877-.286 2.874.962c.456.284.684.427.885.459.2.032.469-.035 1.005-.169A6.6 6.6 0 0 1 13.5 3c.852 0 1.609.098 2.343.28.536.134.805.201 1.006.169.2-.032.428-.175.884-.459 1.997-1.248 2.874-.962 2.874-.962a5.5 5.5 0 0 1 .16 3.431c-.07.28-.104.42-.084.526.02.107.103.225.269.462A5.4 5.4 0 0 1 22 9.646c0 4.462-2.134 5.807-5.177 6.643-.367.101-.507.559-.303.881.296.47.48.99.48 1.588V22"
        {...stroke}
      />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" {...stroke} />
      <path d="M7 10.5V17" {...stroke} />
      <path d="M11 17v-4a3 3 0 0 1 6 0v4M11 13v-2.5" {...stroke} />
      <path d="M7.01 7H7" {...stroke} strokeWidth={2} />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        d="M12 3c5 0 9 3.4 9 7.6s-4 7.6-9 7.6a10.7 10.7 0 0 1-2.6-.3L5 20.4l.5-3.4C3.9 15.6 3 13.4 3 10.6 3 6.4 7 3 12 3Z"
        {...stroke}
      />
    </svg>
  );
}

/** Look up a contact URL by its label in `contacts`. */
const contactHref = (label: string) =>
  contacts.find((c) => c.label === label)?.href ?? "";

const LABEL_GAP = 7;
/** Bar height (h-15) and the gap between the panel and the bar. */
const BAR_H = 60;
const PANEL_DOCK_GAP = 4;
/** Inset between the panel and the shell edge (px-2/pt-2). */
const PANEL_PAD = 8;

/** Panel enters from just above, out of a blur, and leaves quicker than it arrives. */
const panelVariants: Variants = {
  open: { y: 0, scale: 1, opacity: 1, filter: "blur(0px)" },
  closed: {
    y: -6,
    scale: 0.98,
    opacity: 0,
    filter: "blur(4px)",
    // Leaves faster than it arrives.
    transition: { duration: 0.1, ease },
  },
};

const reducedPanelVariants: Variants = {
  open: { opacity: 1 },
  closed: { opacity: 0, transition: { duration: 0.1, ease } },
};

/**
 * Measures a label off-screen so the active tab can animate to an exact width
 * rather than to `auto` — width animations need a number at both ends.
 */
function useLabelWidth(label: string) {
  const ref = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);

  const measure = useCallback(() => {
    const el = ref.current;
    if (el) setWidth(Math.ceil(el.offsetWidth));
  }, []);

  useLayoutEffect(measure, [measure, label]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fonts land after first paint; re-measure when they do.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  return [ref, width] as const;
}

const itemClass =
  "relative grid size-10 place-items-center rounded-full text-foreground/75 transition-colors duration-150 hover:text-foreground";

/**
 * One dock slot: springs under the cursor, dips on press, and floats its label
 * above itself on hover or keyboard focus.
 */
function DockItem({
  label,
  children,
  onClick,
  href,
  external,
  tooltip = true,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  tooltip?: boolean;
}) {
  const [active, setActive] = useState(false);
  const still = useReducedMotion();

  const interaction = still
    ? {}
    : { whileHover: { scale: 1.12, y: -2 }, whileTap: { scale: 0.92, y: 0 } };

  const shared = {
    className: itemClass,
    "aria-label": label,
    onMouseEnter: () => setActive(true),
    onMouseLeave: () => setActive(false),
    onFocus: () => setActive(true),
    onBlur: () => setActive(false),
    transition: springSnappy,
    ...interaction,
  };

  const inner = (
    <>
      {/* Hover pill, faded in behind the icon. */}
      <AnimatePresence>
        {active && (
          <motion.span
            className="absolute inset-0 -z-10 rounded-full bg-foreground/[0.07]"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: duration.fast, ease }}
          />
        )}
      </AnimatePresence>
      {children}
    </>
  );

  return (
    <div className="relative">
      <AnimatePresence>
        {active && tooltip && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={springSnappy}
            className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-xs text-background"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {href ? (
        <motion.a
          {...shared}
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : null)}
        >
          {inner}
        </motion.a>
      ) : (
        <motion.button {...shared} type="button" onClick={onClick}>
          {inner}
        </motion.button>
      )}
    </div>
  );
}

/**
 * Floating dock — the only chrome on the site.
 *
 * Opening the form works like an expandable tab rather than a modal: the bar
 * never leaves, the chat tab widens to reveal its label behind a pill, and the
 * panel opens above the bar inside the same shell. The shell resizes to
 * whatever the panel measures, so one surface moves and the bar stays put.
 */
export function Dock() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const still = useReducedMotion();
  const shellRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(0);
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const [labelRef, labelWidth] = useLabelWidth("Say hi");

  // The bar is absolutely positioned so it can't move while the shell resizes,
  // which means it no longer contributes width — measure it and floor the
  // shell with it, the way the tabs component derives its closed size.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const measure = () => setBarWidth(Math.ceil(el.offsetWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The panel stays mounted (hidden) so its size is always known — the shell
  // animates to a number, and a number needs measuring before the open.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const measure = () => {
      const next = { width: el.offsetWidth, height: el.offsetHeight };
      setPanelSize((current) =>
        current.width === next.width && current.height === next.height
          ? current
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const copyEmail = useCallback(() => {
    void navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, []);

  // Pointer down anywhere outside the shell dismisses it, the way the tabs do.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!shellRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.base, ease }}
            className="pointer-events-none fixed inset-0 z-40 bg-foreground/[0.07]"
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-5 sm:p-8">
        <motion.div
          initial={still ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.35 }}
          className="pointer-events-auto"
        >
          <motion.div
            ref={shellRef}
            // Numeric width/height rather than `layout`: a layout animation
            // moves the shell with a transform, which drags the pinned bar
            // along with it. Animating the real box leaves the bar alone.
            initial={false}
            animate={{
              width: open
                ? Math.max(barWidth, panelSize.width + PANEL_PAD * 2)
                : barWidth || "auto",
              height: open
                ? panelSize.height + PANEL_PAD + PANEL_DOCK_GAP + BAR_H
                : BAR_H,
              borderRadius: open ? 26 : 999,
            }}
            transition={still ? { duration: 0 } : springShell}
            style={{ borderRadius: 999, minWidth: barWidth || undefined }}
            className={`dock relative overflow-hidden ${
              open ? "dock-open" : ""
            }`}
          >
            {/* Panel sits above the bar and stays mounted so it can be
                measured; it's inert and unfocusable while closed. */}
            <div
              className="absolute left-0 top-0 w-max"
              style={{ padding: PANEL_PAD, paddingBottom: 0 }}
            >
              <motion.div
                ref={panelRef}
                variants={still ? reducedPanelVariants : panelVariants}
                initial={false}
                animate={open ? "open" : "closed"}
                transition={still ? { duration: 0.15, ease } : springPanel}
                style={{
                  transformOrigin: "top center",
                  pointerEvents: open ? "auto" : "none",
                }}
                inert={!open}
                aria-hidden={!open}
                className="w-max"
              >
                <SayHiForm onClose={close} />
              </motion.div>
            </div>

            {/* Pinned to the shell's bottom edge: it cannot shift while the
                shell grows above it. */}
            <div
              ref={barRef}
              className="absolute bottom-0 left-0 flex h-15 w-max items-center gap-1 px-2.5"
            >
              {/* The expandable tab: widens to fit its label, pill behind it. */}
              <motion.button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label="Say hi"
                animate={{
                  width: open ? 40 + LABEL_GAP + labelWidth + 14 : 40,
                }}
                transition={still ? { duration: 0 } : springTab}
                className={`relative isolate flex h-10 shrink-0 items-center overflow-hidden rounded-full text-sm ${
                  open
                    ? "justify-start pl-2.5 text-foreground"
                    : "justify-center text-foreground/75 hover:text-foreground"
                }`}
              >
                {open && (
                  <motion.span
                    layoutId="dock-tab-pill"
                    transition={still ? { duration: 0 } : springTab}
                    className="absolute inset-0 -z-10 rounded-full bg-foreground/[0.08]"
                  />
                )}

                <span className="grid shrink-0 place-items-center">
                  <ChatIcon />
                </span>

                <motion.span
                  aria-hidden
                  initial={false}
                  animate={{
                    width: open ? labelWidth : 0,
                    opacity: open ? 1 : 0,
                    marginLeft: open ? LABEL_GAP : 0,
                    filter: still || open ? "blur(0px)" : "blur(3px)",
                  }}
                  transition={
                    still ? { duration: 0 } : open ? labelOpen : labelClose
                  }
                  className="inline-block overflow-hidden whitespace-nowrap"
                >
                  Say hi
                </motion.span>
              </motion.button>

              <DockItem
                label={copied ? "Copied" : "Copy email"}
                onClick={copyEmail}
              >
                {/* The envelope un-draws, then the tick draws itself in its
                    place — mode="wait" keeps the two from overlapping. */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copied ? "check" : "mail"}
                    initial={still ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={
                      still
                        ? { opacity: 0 }
                        : {
                            scale: 0.7,
                            opacity: 0,
                            transition: { duration: 0.14, ease },
                          }
                    }
                    transition={springSnappy}
                    className="grid place-items-center"
                  >
                    {copied ? <CheckIcon /> : <MailIcon />}
                  </motion.span>
                </AnimatePresence>
              </DockItem>

              <DockItem label="GitHub" href={contactHref("github")} external>
                <GithubIcon />
              </DockItem>

              <DockItem
                label="LinkedIn"
                href={contactHref("linkedin")}
                external
              >
                <LinkedinIcon />
              </DockItem>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Off-screen measurer: the tab animates to this exact width. */}
      <span
        aria-hidden
        ref={labelRef}
        className="pointer-events-none fixed left-0 top-0 -z-10 whitespace-nowrap text-sm leading-none opacity-0"
      >
        Say hi
      </span>
    </>
  );
}
