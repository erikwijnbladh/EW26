import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "@/lib/data";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Writing — Erik Wijnbladh",
  description: "Notes on building software, design, and the craft in between.",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Writing() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal>
        <h1 className="text-3xl tracking-tight sm:text-4xl">Writing</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          Notes on building software, design, and the craft in between.
        </p>
      </Reveal>

      <RevealGroup className="mt-12 flex flex-col">
        {posts.map((post) => (
          <RevealItem key={post.slug}>
            <Link
              href={`/writing/${post.slug}`}
              className="group flex items-center gap-4 border-t border-line py-6"
            >
              <span
                className="h-16 w-24 shrink-0 rounded-md grayscale transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundImage: post.shade }}
              />
              <div className="flex-1">
                <p className="text-lg tracking-tight transition-colors group-hover:text-foreground">
                  {post.title}
                </p>
                <p className="mt-1 text-sm text-muted">{post.excerpt}</p>
              </div>
              <span className="hidden font-mono text-xs text-muted sm:block">
                {formatDate(post.date)}
              </span>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}
