"use client";

import { motion, useReducedMotion } from "motion/react";
import { drawOff, drawOn, instant } from "@/lib/motion";

/**
 * The site's copy affordance, shared by the dock's email button and the chat's
 * inline address.
 *
 * Envelope and tick share one box and never unmount — each just draws itself on
 * or retracts off as `copied` flips, so neither can pop in or out. Copying
 * retracts the envelope and draws the tick; reverting does the reverse.
 */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const svgClass = "absolute inset-0 size-full";

export function CopyIcon({ copied }: { copied: boolean }) {
  const still = useReducedMotion();

  return (
    <span className="relative block size-4" aria-hidden>
      <svg viewBox="0 0 24 24" className={svgClass}>
        <motion.rect
          x="2.5"
          y="5"
          width="19"
          height="14"
          rx="3.5"
          {...stroke}
          initial={false}
          animate={{ pathLength: copied ? 0 : 1, opacity: copied ? 0 : 1 }}
          transition={still ? instant : copied ? drawOff() : drawOn(0.2)}
        />
        <motion.path
          d="M3.5 7.5 10.9 12.6a2 2 0 0 0 2.2 0L20.5 7.5"
          {...stroke}
          initial={false}
          animate={{ pathLength: copied ? 0 : 1, opacity: copied ? 0 : 1 }}
          transition={still ? instant : copied ? drawOff(0.04) : drawOn(0.3)}
        />
      </svg>

      <svg viewBox="0 0 24 24" className={svgClass}>
        <motion.path
          d="M4 12 9 17L20 6"
          {...stroke}
          initial={false}
          animate={{ pathLength: copied ? 1 : 0, opacity: copied ? 1 : 0 }}
          transition={still ? instant : copied ? drawOn(0.16) : drawOff()}
        />
      </svg>
    </span>
  );
}
