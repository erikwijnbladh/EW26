"use client";

import { MeshGradient } from "@paper-design/shaders-react";

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
  /** A small hot opening in a deep field — one bright light, a lot of dark. */
  aperture: ({ className }) => (
    <MeshGradient
      speed={0}
      frame={31000}
      colors={["#0c0b10", "#171622", "#3d4a63", "#f0ead9"]}
      distortion={0.85}
      swirl={0.5}
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
