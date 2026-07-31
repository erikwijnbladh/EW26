import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeShiki from "@shikijs/rehype";
import { getPagePosts, getPost, readingTime } from "@/lib/content";
import { mdxComponents } from "@/components/mdx";
import { PostArt } from "@/components/post-shader";
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

/**
 * The compiled body, cached.
 *
 * Shiki reads the clock while it highlights, and under `cacheComponents` an
 * uncached server render isn't allowed to — the current time would be baked
 * into a prerender that outlives it. The output here doesn't depend on the
 * clock at all: it's a pure function of an `.mdx` file that only changes on
 * deploy. Saying so with `use cache` satisfies the rule and means the grammars
 * are loaded and the highlighting is done once for a post rather than once per
 * render.
 */
async function PostBody({ source }: { source: string }) {
  "use cache";

  return (
    <MDXRemote
      source={source}
      components={mdxComponents}
      options={{
        mdxOptions: {
          rehypePlugins: [
            [
              // Warm light theme, to sit on paper rather than fight it. Shiki
              // paints the theme's own background onto the block; the `pre`
              // component drops it so code sits on the site's surface instead
              // of a second, colder one.
              rehypeShiki,
              { theme: "vitesse-light" },
            ],
          ],
        },
      }}
    />
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
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
  // External-link posts have no detail page.
  if (!post || post.link) notFound();

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

      <Reveal delay={0.05}>
        <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl sm:aspect-[21/9]">
          <PostArt
            shader={post.shader}
            preview={post.preview}
            className="h-full w-full"
          />
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <header className="mt-8">
          <h1 className="text-3xl lowercase tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-3 flex items-center gap-2 font-mono text-xs text-muted">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>{readingTime(post.body)} min read</span>
          </div>
        </header>
      </Reveal>

      <div className="mt-6">
        <PostBody source={post.body} />
      </div>

      {next && next.slug !== slug && (
        <Reveal delay={0.1}>
          <Link
            href={`/${next.slug}`}
            className="group mt-16 flex items-center justify-between pt-6"
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
