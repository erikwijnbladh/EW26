"use client";

import { ImageDithering } from "@paper-design/shaders-react";

/**
 * The face, run through a dithering shader and parked behind the page — big,
 * cropped and faded into the background so the text stays the loudest thing.
 * Static (speed 0); it's a texture, not an animation.
 */
export function PortraitBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 right-0 -z-10 w-[92%] select-none opacity-[0.15] sm:w-[58%] sm:opacity-[0.4]"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 8%, #000 62%), linear-gradient(to bottom, #000 50%, transparent 94%)",
        maskComposite: "intersect",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 8%, #000 62%), linear-gradient(to bottom, #000 50%, transparent 94%)",
        WebkitMaskComposite: "source-in",
      }}
    >
      <ImageDithering
        image="/images/pfp.png"
        colorBack="#00000000"
        colorFront="#15140f"
        colorHighlight="#15140f"
        colorSteps={2}
        type="4x4"
        size={3}
        fit="cover"
        scale={1.2}
        offsetY={-0.05}
        speed={0}
        className="h-full w-full"
      />
    </div>
  );
}
