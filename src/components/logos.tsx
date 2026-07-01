/** Brand marks used in hover previews. Kept as inline SVG so they stay crisp
 *  at any size with no asset files. */

/** Compileit wordmark glyph — a 3×3 grid of squares (from the brand file). */
export function CompileitMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      className={className}
      fill="#ffffff"
      aria-hidden
    >
      <rect x="12" y="0" width="12" height="12" />
      <rect x="0" y="12" width="12" height="12" />
      <rect x="0" y="24" width="12" height="12" />
      <rect x="12" y="24" width="12" height="12" />
    </svg>
  );
}

/** Map of item id → logo mark, for the home hover preview. */
export const previewLogos: Record<
  string,
  (props: { className?: string }) => React.ReactNode
> = {
  "current-role": CompileitMark,
};
