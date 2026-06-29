import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "@/lib/data";
import { Reveal } from "@/components/reveal";

type Params = { slug: string };

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} — Erik Wijnbladh`,
    description: post.excerpt,
  };
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
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();

  const post = posts[index];
  const next = posts[(index + 1) % posts.length];

  return (
    <article className="mx-auto w-full max-w-3xl px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal>
        <Link
          href="/writing"
          className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">
            ←
          </span>
          Writing
        </Link>
      </Reveal>

      <Reveal delay={0.05}>
        <div
          className="mt-6 aspect-[16/9] w-full rounded-2xl grayscale sm:aspect-[21/9]"
          style={{ backgroundImage: post.shade }}
        />
      </Reveal>

      <Reveal delay={0.1}>
        <header className="mt-8">
          <h1 className="text-3xl tracking-tight sm:text-4xl">{post.title}</h1>
          <p className="mt-3 font-mono text-xs text-muted">
            {formatDate(post.date)}
          </p>
        </header>
      </Reveal>

      <div className="mt-10 flex flex-col gap-5">
        {post.body.map((paragraph, i) => (
          <Reveal key={i} delay={0.05 + i * 0.04}>
            <p className="max-w-xl text-base leading-relaxed text-muted">
              {paragraph}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <Link
          href={`/writing/${next.slug}`}
          className="group mt-16 flex items-center justify-between border-t border-line pt-6"
        >
          <div>
            <p className="text-xs text-muted">Next</p>
            <p className="mt-1 text-lg tracking-tight transition-colors group-hover:text-foreground">
              {next.title}
            </p>
          </div>
          <span className="text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground">
            →
          </span>
        </Link>
      </Reveal>
    </article>
  );
}
