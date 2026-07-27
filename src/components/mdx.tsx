import NextImage from "next/image";
import type { MDXComponents } from "mdx/types";
import { IntentField } from "@/components/intent-field";

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
  Video,
  ButtonLink,
  Image,
  Gallery,
  IntentField,
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
};
