"use client";

import {
  GrainGradient,
  MeshGradient,
  NeuroNoise,
  Warp,
} from "@paper-design/shaders-react";

type SceneProps = { className?: string };

/**
 * Static, vivid shader artwork for post previews and heroes. Each scene is a
 * paper-shaders canvas frozen at a hand-picked frame (speed 0), so it renders
 * as a still image with far more depth than a CSS gradient. Posts opt in via
 * the `shader` frontmatter key; the `preview` gradient stays as fallback.
 */
const scenes: Record<string, (props: SceneProps) => React.ReactNode> = {
  /** Electric synapses on ink — designing for intelligence. */
  neuro: ({ className }) => (
    <NeuroNoise
      speed={0}
      frame={52000}
      scale={0.6}
      colorBack="#0b0a14"
      colorMid="#6d5cff"
      colorFront="#b7f4e0"
      brightness={0.1}
      contrast={0.42}
      className={className}
    />
  ),
  /** A warm nebula swirl — judgement and taste. */
  nebula: ({ className }) => (
    <Warp
      speed={0}
      frame={38000}
      colors={["#14101f", "#ff6b4a", "#2c1b45", "#ffc46b"]}
      proportion={0.42}
      softness={1}
      distortion={0.22}
      swirl={0.9}
      swirlIterations={10}
      shape="checks"
      shapeScale={0.08}
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
