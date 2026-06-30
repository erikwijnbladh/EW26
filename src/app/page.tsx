import Image from "next/image";
import { profile, currentRoleItem, type HomeListItem } from "@/lib/data";
import { getAllPosts } from "@/lib/content";
import { Reveal } from "@/components/reveal";
import { HomeList } from "@/components/home-list";

export default function Home() {
  const postItems: HomeListItem[] = getAllPosts().map((post) => ({
    id: post.slug,
    title: post.title.toLowerCase(),
    subtitle: post.subtitle.toLowerCase(),
    preview: post.preview,
    href: post.link ?? `/${post.slug}`,
    external: Boolean(post.link),
  }));

  const homeItems: HomeListItem[] = [currentRoleItem, ...postItems];

  return (
    <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
      <section className="flex flex-col gap-6 pb-16 pt-4 sm:pb-24">
        <Reveal>
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full shadow-ring sm:h-14 sm:w-14">
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

      <section className="pb-24 sm:pb-32">
        <Reveal>
          <HomeList items={homeItems} />
        </Reveal>
      </section>
    </div>
  );
}
