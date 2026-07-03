"use client";

import {
  Dithering,
  GrainGradient,
  MeshGradient,
  Swirl,
} from "@paper-design/shaders-react";

type SceneProps = { className?: string };

/**
 * Static, vivid shader artwork for post previews and heroes. Each scene is a
 * paper-shaders canvas frozen at a hand-picked frame (speed 0), so it renders
 * as a still image with far more depth than a CSS gradient. Posts opt in via
 * the `shader` frontmatter key; the `preview` gradient stays as fallback.
 */
const scenes: Record<string, (props: SceneProps) => React.ReactNode> = {
  /**
   * A glowing sphere rendered in ordered dither — the nav dot grown up.
   * Discrete dots reading as one continuous form: a machine approximating
   * something human. For "designing for intelligence".
   */
  dither: ({ className }) => (
    <Dithering
      speed={0}
      frame={30000}
      shape="sphere"
      type="4x4"
      size={3}
      scale={0.9}
      colorBack="#0a0e1a"
      colorFront="#38bdf8"
      className={className}
    />
  ),
  /**
   * A galaxy swirl in the meme's deep-space palette — ink, bone, gold —
   * so the hero and the astronaut image inside read as one piece.
   * For "judgement and taste".
   */
  galaxy: ({ className }) => (
    <Swirl
      speed={0}
      frame={24000}
      colorBack="#15140f"
      colors={["#e4e0d6", "#c9a86a", "#3a3428"]}
      bandCount={4}
      twist={0.25}
      center={0.15}
      proportion={0.45}
      softness={0.2}
      noiseFrequency={0.4}
      noise={0.15}
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
  /** Campfire embers — d&d campaign generator. */
  ember: ({ className }) => (
    <GrainGradient
      speed={0}
      frame={61000}
      colorBack="#170d08"
      colors={["#f97316", "#fde047", "#dc2626", "#7c2d12"]}
      softness={0.6}
      intensity={0.55}
      noise={0.35}
      shape="wave"
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
