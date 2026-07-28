"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { duration, ease, enter } from "@/lib/motion";

/** Rise + sharpen + fade. Flattened to a plain fade when motion is reduced. */
function useVariants(): Variants {
  const still = useReducedMotion();

  if (still) {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { duration: duration.fast } },
    };
  }

  return {
    hidden: enter.hidden,
    show: {
      ...enter.show,
      transition: { duration: duration.slow, ease },
    },
  };
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const variants = useVariants();

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const variants = useVariants();

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
