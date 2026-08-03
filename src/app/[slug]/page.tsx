import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPagePosts, getPost } from "@/lib/content";
import { work } from "@/lib/data";
import { mdxComponents } from "@/components/mdx";
import { Reveal } from "@/components/reveal";

type Params = { slug: string };

export function generateStaticParams() {
  return getPagePosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title.toLowerCase()} — erik wijnbladh`,
    description: post.subtitle,
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function Post({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  // The hero is the project's own artifact rather than generated art. A case
  // page whose header is a gradient is decorating the thing instead of showing
  // it; where there's nothing real to show yet, there's simply no header.
  const project = work.find((item) => item.id === slug);
  const media = project?.media;

  const pages = getPagePosts();
  const index = pages.findIndex((p) => p.slug === slug);
  const next = pages[(index + 1) % pages.length];

  return (
    <article className="mx-auto w-full max-w-3xl px-5 pb-40 sm:px-8 sm:pb-44">
      <Reveal>
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">
            ←
          </span>
          back
        </Link>
      </Reveal>

      {media && (
        <Reveal delay={0.05}>
          <div className="mt-6 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-surface shadow-ring">
            {media.type === "video" ? (
              <video
                aria-label={media.alt}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              >
                <source src={`${media.src}.webm`} type="video/webm" />
                <source src={`${media.src}.mp4`} type="video/mp4" />
              </video>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.src}
                alt={media.alt}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <header className="mt-8">
          <h1 className="text-3xl lowercase tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-2 text-base text-muted">{post.subtitle}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
            <span>{formatDate(post.date)}</span>
            {project?.href && (
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-line underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
              >
                source ↗
              </a>
            )}
          </p>
        </header>
      </Reveal>

      <div className="mt-6">
        <MDXRemote source={post.body} components={mdxComponents} />
      </div>

      {next && next.slug !== slug && (
        <Reveal delay={0.1}>
          <Link
            href={`/${next.slug}`}
            className="group mt-16 flex items-center justify-between border-t border-line pt-6"
          >
            <div>
              <p className="text-xs text-muted">next</p>
              <p className="mt-1 text-lg lowercase tracking-tight transition-colors group-hover:text-foreground">
                {next.title}
              </p>
            </div>
            <span className="text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground">
              →
            </span>
          </Link>
        </Reveal>
      )}
    </article>
  );
}
