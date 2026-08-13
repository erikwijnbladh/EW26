import { Dithering } from "@paper-design/shaders-react";

/**
 * The shared dithered-sphere indicator, used in the nav and the home list.
 *
 * `speed` is a prop because the chat uses the same dot to say two things: it
 * turns over slowly while it is only an identity, and quicker while an answer
 * is on its way. Zero holds it still, which is what reduced motion wants.
 */
export function DitherDot({
  speed = 2,
  size = 0.1,
  minPixelRatio = 1,
}: {
  speed?: number;
  /**
   * The dither cell, in the shader's own units. At the nav's 12px the default
   * is fine enough to read as a plain dot; drawn four times that size it is a
   * solid blob with a soft edge and none of the halftone this is named for, so
   * anything larger wants a coarser cell.
   */
  size?: number;
  /**
   * The canvas renders at CSS resolution by default, which nobody can see at
   * 12px and everybody can see at 32 on a retina screen.
   */
  minPixelRatio?: number;
}) {
  return (
    <Dithering
      speed={speed}
      shape="sphere"
      type="4x4"
      size={size}
      scale={1}
      minPixelRatio={minPixelRatio}
      colorBack="#00000000"
      colorFront="#15140f"
      className="h-full w-full rounded-full"
    />
  );
}
