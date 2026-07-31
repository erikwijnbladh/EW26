import NextImage from "next/image";
import type { MDXComponents } from "mdx/types";
import { PostArt } from "@/components/post-shader";
import { SurfaceDemo } from "@/components/demos/surface-demo";

/**
 * A 16:9 slot in the body of a post, for showing the thing working.
 *
 * `src` is optional, and that is the whole point: a post can reserve the slot
 * and fill it with the same shader art the rest of the site uses until a
 * recording exists. The frame, the radius and the ring are identical either
 * way, so landing the clip later changes what's inside the box and nothing
 * around it — no reflow, no "coming soon", no gap where a demo should be.
 *
 * Captions are written to read as statements about the idea rather than
 * descriptions of footage, so they hold up before the video lands.
 */
function Demo({
  src,
  poster,
  shader,
  preview,
  caption,
}: {
  src?: string;
  poster?: string;
  shader?: string;
  preview?: string;
  caption?: string;
}) {
  return (
    <figure className="my-8">
      <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-ring">
        {src ? (
          <video
            src={src}
            poster={poster}
            controls
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <PostArt shader={shader} preview={preview} className="h-full w-full" />
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function Video({ src, poster }: { src: string; poster?: string }) {
  return (
    <video
      src={src}
      poster={poster}
      controls
      playsInline
      className="my-8 w-full rounded-2xl shadow-ring"
    />
  );
}

function ButtonLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="my-4 inline-flex items-center rounded-full shadow-ring px-4 py-1.5 text-sm no-underline transition-colors duration-300 hover:bg-surface"
    >
      {children}
    </a>
  );
}

function Image({ src, alt }: { src: string; alt: string }) {
  return (
    <span className="my-8 block overflow-hidden rounded-2xl shadow-ring">
      <NextImage
        src={src}
        alt={alt}
        width={1280}
        height={720}
        className="h-auto w-full"
      />
    </span>
  );
}

function Gallery({ images }: { images: string[] }) {
  return (
    <span className="my-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {images.map((src) => (
        <Image key={src} src={src} alt="" />
      ))}
    </span>
  );
}

/** Components available to every MDX post, plus prose styling for raw markdown. */
export const mdxComponents: MDXComponents = {
  Demo,
  SurfaceDemo,
  Video,
  ButtonLink,
  Image,
  Gallery,
  p: ({ children }) => (
    <p className="my-5 max-w-xl text-base leading-relaxed text-muted">
      {children}
    </p>
  ),
  h2: ({ children }) => (
    <h2 className="mt-12 text-2xl tracking-tight">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 text-xl tracking-tight">{children}</h3>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-foreground underline decoration-line underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-5 max-w-xl list-disc space-y-2 pl-5 text-base leading-relaxed text-muted">
      {children}
    </ul>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
  /**
   * Fenced blocks, after Shiki has been through them.
   *
   * Shiki colours the tokens with inline styles on the inner spans and paints
   * the theme's own background onto this element. The spans are the whole
   * point and are left alone; the background is dropped, because the theme's
   * near-white is a colder paper than the site's and reads as a panel that
   * wandered in from another design. The surface token replaces it.
   *
   * The chip styling on inline `code` is also cleared off the child here — it
   * would otherwise paint a second background behind every line.
   */
  pre: ({ children, style, ...props }) => (
    <pre
      {...props}
      style={{ ...style, backgroundColor: undefined }}
      className="my-6 max-w-xl overflow-x-auto rounded-xl bg-surface p-4 font-mono text-[0.8rem] leading-relaxed [&>code]:bg-transparent [&>code]:p-0"
    >
      {children}
    </pre>
  ),
};
