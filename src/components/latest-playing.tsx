"use client";

import { motion, useReducedMotion } from "motion/react";
import { nowPlaying } from "@/lib/data";

/** How much each row dims as it goes down the list. */
const dim = (i: number) => Math.max(0.18, 1 - i * 0.19);

/** Three little bars, pulsing. Marks the most recent track. */
function Equalizer() {
  const still = useReducedMotion();

  return (
    <span className="flex h-3 w-3 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-full w-[2px] origin-bottom rounded-full bg-foreground"
          initial={{ scaleY: 0.35 }}
          animate={still ? { scaleY: 0.55 } : { scaleY: [0.3, 1, 0.3] }}
          transition={
            still
              ? { duration: 0 }
              : {
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.16,
                }
          }
        />
      ))}
    </span>
  );
}

/**
 * The last few tracks — a plain hairline list that dims and fades out toward
 * the bottom, so the newest one reads first and the rest trail off.
 */
export function LatestPlaying() {
  return (
    <section aria-label="Latest playing">
      <p className="text-xs uppercase tracking-[0.08em] text-muted/70">
        Latest playing
      </p>

      <ol className="mt-4 [mask-image:linear-gradient(to_bottom,#000_45%,transparent_100%)]">
        {nowPlaying.map((track, i) => (
          <motion.li
            key={`${track.artist}-${track.title}`}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: dim(i), y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: 0.15 + i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex items-baseline gap-4 border-t border-line py-3 first:border-t-0"
          >
            <span className="flex min-w-0 items-baseline gap-2.5">
              {i === 0 && (
                <span className="translate-y-[1px]">
                  <Equalizer />
                </span>
              )}
              <span className="truncate text-[15px] text-foreground">
                {track.title}
              </span>
            </span>
            <span className="ml-auto shrink-0 text-[15px] font-light text-muted">
              {track.artist}
            </span>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
