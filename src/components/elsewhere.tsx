"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { elsewhere } from "@/lib/data";
import { easeGlide, springSnappy } from "@/lib/motion";

const viewerTransition = { duration: 0.34, ease: easeGlide };

function Viewer({
  open,
  onClose,
  onMove,
}: {
  open: number;
  onClose: () => void;
  onMove: (step: -1 | 1) => void;
}) {
  const still = useReducedMotion();
  const item = elsewhere[open];

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-background/90 px-5 py-8 backdrop-blur-md sm:px-10"
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
        className="relative flex max-h-full w-full max-w-md flex-col items-center"
        initial={still ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
        transition={still ? { duration: 0 } : springSnappy}
      >
        <div className="relative aspect-[2/3] max-h-[calc(100dvh-8rem)] w-full overflow-hidden rounded-2xl bg-surface shadow-ring-raised">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={item.src}
              className="absolute inset-0"
              initial={still ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={still ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={still ? { duration: 0 } : viewerTransition}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) calc(100vw - 40px), 448px"
                placeholder="blur"
                blurDataURL={item.blur}
                className="object-cover"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <figcaption className="mt-4 min-h-5 px-12 text-center text-sm text-muted">
          {item.caption}
        </figcaption>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close image viewer"
          autoFocus
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-background/90 text-foreground shadow-ring outline-none backdrop-blur-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-foreground/40"
        >
          <X className="size-4" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => onMove(-1)}
          aria-label="Previous image"
          className="absolute bottom-0 left-0 grid size-9 place-items-center rounded-full text-muted outline-none transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/40 sm:bottom-1/2 sm:-left-14 sm:translate-y-1/2"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => onMove(1)}
          aria-label="Next image"
          className="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full text-muted outline-none transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground/40 sm:bottom-1/2 sm:-right-14 sm:translate-y-1/2"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </motion.figure>
    </motion.div>,
    document.body,
  );
}

/** A compact portrait grid with an immersive, keyboard-friendly viewer. */
export function Elsewhere() {
  const still = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const openedFrom = useRef<number | null>(null);
  const expanded = open !== null;

  const move = useCallback((step: -1 | 1) => {
    setOpen((current) => {
      if (current === null) return current;
      return (current + step + elsewhere.length) % elsewhere.length;
    });
  }, []);

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
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [close, expanded, move]);

  return (
    <section aria-label="Elsewhere">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-xs text-muted/70">Elsewhere</p>
        <p className="text-[11px] text-muted/50">Tap to expand</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {elsewhere.map((item, index) => (
          <motion.button
            key={item.src}
            ref={(node) => {
              tiles.current[index] = node;
            }}
            type="button"
            aria-label={`Expand: ${item.caption}`}
            onClick={() => {
              openedFrom.current = index;
              setOpen(index);
            }}
            className="group relative aspect-[2/3] overflow-hidden rounded-xl bg-surface shadow-ring outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            initial={still ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: still ? 0 : 0.45, delay: still ? 0 : index * 0.045, ease: easeGlide }}
            whileHover={still ? undefined : { y: -3, scale: 1.015 }}
            whileTap={still ? undefined : { scale: 0.985 }}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 640px) 30vw, 150px"
              placeholder="blur"
              blurDataURL={item.blur}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <Viewer key="image-viewer" open={open} onClose={close} onMove={move} />
        )}
      </AnimatePresence>
    </section>
  );
}
