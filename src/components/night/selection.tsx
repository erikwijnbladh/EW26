"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A word, selected the way a design tool selects a layer: a frame, four
 * handles, and the size of the box underneath. The size is measured, not
 * typed, so it changes if the type does — it is the actual box.
 */
export function Selection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.target.getBoundingClientRect();
      setSize({ w: Math.round(box.width), h: Math.round(box.height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Colour set inline: the global `* { border-color }` rule is unlayered and
  // would beat a Tailwind border-colour utility.
  const blue = { borderColor: "#4c8dff" };
  const handle = "absolute size-[5px] border bg-background";

  return (
    <span className="relative inline-block whitespace-nowrap">
      <span
        ref={ref}
        className="relative z-10 px-1 font-medium text-foreground"
      >
        {children}
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-0 border" style={blue}>
        <span style={blue} className={`${handle} -left-[3px] -top-[3px]`} />
        <span style={blue} className={`${handle} -right-[3px] -top-[3px]`} />
        <span style={blue} className={`${handle} -bottom-[3px] -left-[3px]`} />
        <span style={blue} className={`${handle} -bottom-[3px] -right-[3px]`} />
      </span>
      {size && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 rounded-[3px] bg-[#4c8dff] px-1 py-px font-mono text-[9px] leading-tight text-white tabular-nums"
        >
          {size.w} × {size.h}
        </span>
      )}
    </span>
  );
}
