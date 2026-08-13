import { Dithering } from "@paper-design/shaders-react";

/** The shared dithered-sphere indicator, used in the nav and the home list. */
export function DitherDot() {
  return (
    <Dithering
      speed={2}
      shape="sphere"
      type="4x4"
      size={0.1}
      scale={1}
      colorBack="#00000000"
      colorFront="#15140f"
      className="h-full w-full rounded-full"
    />
  );
}
