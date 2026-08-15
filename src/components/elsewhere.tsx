"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { X } from "lucide-react";
import { elsewhere } from "@/lib/data";
import { easeGlide, springSnappy, springSurface } from "@/lib/motion";

const viewerTransition = { duration: 0.34, ease: easeGlide };

/**
 * The 21st.dev Image Tiles composition, stretched across five portrait cards.
 * Each card keeps a deliberately imperfect resting angle, then lifts and
 * nearly straightens under the pointer.
 */
const tilePositions = [
  { left: "0%", y: 12, rotate: -8, hoverRotate: 1 },
  { left: "17%", y: 2, rotate: 5, hoverRotate: -1 },
  { left: "34%", y: -8, rotate: -3, hoverRotate: 0 },
  { left: "51%", y: 4, rotate: 6, hoverRotate: 1 },
  { left: "68%", y: 14, rotate: -6, hoverRotate: 2 },
] as const;

function Viewer({
  open,
  onClose,
}: {
  open: number;
  onClose: () => void;
}) {
  const still = useReducedMotion();
  const item = elsewhere[open];

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-background/35 px-8 py-16 backdrop-blur-[8px]"
      role="dialog"
      aria-modal="true"
      aria-label={item.caption}
      initial={still ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={still ? { opacity: 0 } : { opacity: 0 }}
      transition={still ? { duration: 0 } : viewerTransition}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;

        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
        );
        const first = controls[0];
        const last = controls.at(-1);

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <motion.figure
        layoutId={`elsewhere-photo-${open}`}
        className="relative flex w-[min(20rem,80vw)] cursor-zoom-out flex-col items-center"
        initial={false}
        transition={still ? { duration: 0 } : springSurface}
        onClick={onClose}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-surface shadow-ring-raised">
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="(max-width: 640px) 80vw, 320px"
            placeholder="blur"
            blurDataURL={item.blur}
            className="object-cover"
          />
        </div>

        <figcaption className="mt-3 min-h-5 px-10 text-center text-xs text-muted">
          {item.caption}
        </figcaption>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="Close image viewer"
          autoFocus
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/85 text-foreground shadow-ring outline-none backdrop-blur-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-foreground/40"
        >
          <X className="size-4" aria-hidden />
        </button>
      </motion.figure>
    </motion.div>,
    document.body,
  );
}

/** Staggered portrait tiles with a small, focused expansion state. */
export function Elsewhere() {
  const still = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const openedFrom = useRef<number | null>(null);
  const expanded = open !== null;

  const close = useCallback(() => {
    const selected = openedFrom.current;
    setOpen(null);
    requestAnimationFrame(() => {
      if (selected !== null) tiles.current[selected]?.focus();
    });
  }, []);

  useEffect(() => {
    if (!expanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [close, expanded]);

  return (
    <LayoutGroup id="elsewhere">
      <section aria-label="Elsewhere">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-xs text-muted/70">Elsewhere</p>
        <p className="text-[11px] text-muted/50">Tap to expand</p>
      </div>

      <div className="relative aspect-[3/2] w-full">
        {elsewhere.map((item, index) => {
          const position = tilePositions[index];

          return (
            <motion.button
              key={item.src}
              layoutId={`elsewhere-photo-${index}`}
              ref={(node) => {
                tiles.current[index] = node;
              }}
              type="button"
              aria-label={`Expand: ${item.caption}`}
              onClick={() => {
                openedFrom.current = index;
                setOpen(index);
              }}
              className="group absolute top-[14%] aspect-[2/3] w-[32%] origin-bottom overflow-hidden rounded-xl bg-surface shadow-ring outline-none focus-visible:z-[60] focus-visible:ring-2 focus-visible:ring-foreground/40"
              style={{
                left: position.left,
                zIndex: elsewhere.length - index,
              }}
              initial={
                still
                  ? false
                  : { opacity: 0, y: position.y + 12, rotate: position.rotate }
              }
              whileInView={{
                opacity: 1,
                y: position.y,
                rotate: still ? 0 : position.rotate,
              }}
              viewport={{ once: true, margin: "-5%" }}
              transition={
                still
                  ? { duration: 0 }
                  : {
                      ...springSnappy,
                      delay: index * 0.045,
                    }
              }
              whileHover={
                still
                  ? undefined
                  : {
                      y: position.y - 10,
                      rotate: position.hoverRotate,
                    }
              }
              whileTap={still ? undefined : { scale: 0.985 }}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 32vw, 150px"
                placeholder="blur"
                blurDataURL={item.blur}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {open !== null && (
          <Viewer key="image-viewer" open={open} onClose={close} />
        )}
      </AnimatePresence>
      </section>
    </LayoutGroup>
  );
}
