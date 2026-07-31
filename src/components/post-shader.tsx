"use client";

import {
  GrainGradient,
  MeshGradient,
  Warp,
} from "@paper-design/shaders-react";

type SceneProps = { className?: string };

/**
 * Static shader artwork for post previews and heroes. Each scene is a
 * paper-shaders canvas frozen at a hand-picked frame (speed 0), so it renders
 * as a still image with far more depth than a CSS gradient. Posts opt in via
 * the `shader` frontmatter key; the `preview` gradient stays as fallback.
 *
 * Scenes are named for what they look like rather than which post they serve,
 * and there is one per post plus `slot`. Adding art is ten lines — so the list
 * is kept to what's actually rendered rather than to a palette of options,
 * which is how the previous set ended up outliving every post that used it.
 */
const scenes: Record<string, (props: SceneProps) => React.ReactNode> = {
  /** Cool mint over slate — kvitt, where the point is everything settling. */
  settle: ({ className }) => (
    <MeshGradient
      speed={0}
      frame={22000}
      colors={["#0f1a17", "#1f3d35", "#4f9c86", "#dceee7"]}
      distortion={0.75}
      swirl={0.45}
      className={className}
    />
  ),
  /** A purple pulse on ink — the stream notifier, waiting for something. */
  relay: ({ className }) => (
    <Warp
      speed={0}
      frame={40000}
      colors={["#0b0814", "#3b1d6e", "#9146ff", "#e6dcff"]}
      proportion={0.4}
      softness={0.7}
      distortion={0.14}
      swirl={0.4}
      swirlIterations={6}
      shape="stripes"
      shapeScale={0.12}
      className={className}
    />
  ),
  /**
   * The loudest thing on the site, which is the correct amount for a post
   * about brainrot reels — but pulled back off full neon, because at that
   * saturation it stopped reading as a deliberately garish hero and started
   * reading as a rendering fault on a warm paper page.
   */
  rot: ({ className }) => (
    <GrainGradient
      speed={0}
      frame={58000}
      colorBack="#120a1c"
      colors={["#d93a7a", "#3fbf74", "#e0be4a", "#6b3fbf"]}
      softness={0.7}
      intensity={0.42}
      noise={0.3}
      shape="wave"
      className={className}
    />
  ),
  /** Warm dusk, for the playlist generator. */
  dusk: ({ className }) => (
    <Warp
      speed={0}
      frame={35000}
      colors={["#160f1c", "#7a2f52", "#f0714a", "#ffd9a8"]}
      proportion={0.44}
      softness={0.95}
      distortion={0.2}
      swirl={0.8}
      swirlIterations={9}
      shape="checks"
      shapeScale={0.09}
      className={className}
    />
  ),
  /** Indigo glass panes — pane. */
  prism: ({ className }) => (
    <MeshGradient
      speed={0}
      frame={26000}
      colors={["#241d6b", "#4338ca", "#8b5cf6", "#a5b4fc"]}
      distortion={0.9}
      swirl={0.6}
      className={className}
    />
  ),
  /**
   * A dark, dormant screen, in the site's own inks — the standing fill for an
   * in-body `Demo` slot before its recording exists.
   *
   * Deliberately not tied to a post, and deliberately not vivid: reusing a
   * post's hero scene here reads as the same image printed twice rather than
   * as a frame waiting to be filled.
   */
  slot: ({ className }) => (
    <MeshGradient
      speed={0}
      frame={17000}
      colors={["#15140f", "#2a2823", "#4a4740", "#6b6a64"]}
      distortion={0.7}
      swirl={0.4}
      className={className}
    />
  ),
};

export function PostShader({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const scene = name ? scenes[name] : undefined;
  return scene ? <>{scene({ className })}</> : null;
}

export function hasPostShader(name?: string): boolean {
  return Boolean(name && scenes[name]);
}

/**
 * Post artwork that prefers the shader scene and falls back to the CSS
 * `preview` gradient. Client component so server pages don't have to know
 * which scene names exist.
 */
export function PostArt({
  shader,
  preview,
  className,
}: {
  shader?: string;
  preview?: string;
  className?: string;
}) {
  const scene = shader ? scenes[shader] : undefined;
  if (scene) return <>{scene({ className })}</>;
  return <div className={className} style={{ backgroundImage: preview }} />;
}
