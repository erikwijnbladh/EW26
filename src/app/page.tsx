import Image from "next/image";
import Link from "next/link";
import { profile, work, projects, posts } from "@/lib/data";
import { Reveal, RevealGroup, RevealItem } from "@/components/reveal";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
      <section className="flex flex-col gap-6 pb-16 pt-4 sm:pb-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-line sm:h-14 sm:w-14">
              <Image
                src="/images/pfp.png"
                alt={profile.name}
                fill
                sizes="56px"
                className="object-cover grayscale"
                priority
              />
            </div>
            <p className="text-sm text-muted">
              {profile.role} · {profile.location}
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="max-w-xl text-3xl leading-[1.15] tracking-tight sm:text-4xl">
            {profile.tagline}
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            I&apos;m {profile.name.split(" ")[0]} — currently taking on a
            limited number of new projects. Have a look at the work, or{" "}
            <a
              href={`mailto:${profile.email}`}
              className="text-foreground underline decoration-line underline-offset-4 transition-colors hover:decoration-foreground"
            >
              get in touch
            </a>
            .
          </p>
        </Reveal>
      </section>

      <section className="pb-16 sm:pb-24">
        <Reveal>
          <h2 className="font-serif text-2xl italic text-muted">Work</h2>
        </Reveal>
        <RevealGroup className="mt-6 flex flex-col">
          {work.map((item) => (
            <RevealItem key={item.org}>
              <div
                data-cursor
                className="group flex flex-col gap-1 border-t border-line py-5 transition-colors sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="font-mono text-xs text-muted sm:w-28 sm:shrink-0">
                  {item.period}
                </span>
                <div className="flex-1">
                  <p className="text-base">
                    {item.role}{" "}
                    <span className="text-muted">— {item.org}</span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="pb-16 sm:pb-24">
        <Reveal>
          <h2 className="font-serif text-2xl italic text-muted">
            Selected projects
          </h2>
        </Reveal>
        <RevealGroup className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          {projects.map((project) => (
            <RevealItem key={project.slug}>
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col justify-between gap-4 bg-background p-6 transition-colors duration-300 hover:bg-surface"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg tracking-tight">{project.title}</h3>
                  <span className="font-mono text-xs text-muted">
                    {project.year}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted">
                  {project.description}
                </p>
                <div className="flex items-center justify-between">
                  <ul className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                  <span className="translate-x-0 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground">
                    →
                  </span>
                </div>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="pb-24 sm:pb-32">
        <Reveal>
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl italic text-muted">Writing</h2>
            <Link
              href="/writing"
              className="text-xs text-muted underline decoration-line underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
            >
              All posts
            </Link>
          </div>
        </Reveal>
        <RevealGroup className="mt-6 flex flex-col">
          {posts.slice(0, 3).map((post) => (
            <RevealItem key={post.slug}>
              <Link
                href={`/writing/${post.slug}`}
                className="group flex items-center gap-4 border-t border-line py-5"
              >
                <span
                  className="h-12 w-16 shrink-0 rounded-md grayscale transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: post.shade }}
                />
                <div className="flex-1">
                  <p className="text-base transition-colors group-hover:text-foreground">
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
      </section>
    </div>
  );
}
