import { currentRoleItem, type HomeListItem } from "@/lib/data";
import { getAllPosts } from "@/lib/content";
import { Reveal } from "@/components/reveal";
import { HomeList } from "@/components/home-list";

export default function Home() {
  const postItems: HomeListItem[] = getAllPosts().map((post) => ({
    id: post.slug,
    title: post.title.toLowerCase(),
    subtitle: post.subtitle.toLowerCase(),
    preview: post.preview,
    shader: post.shader,
    href: post.link ?? `/${post.slug}`,
    external: Boolean(post.link),
  }));

  const aboutItem: HomeListItem = {
    id: "about",
    title: "about",
    href: "/about",
    separated: true,
  };

  const homeItems: HomeListItem[] = [
    currentRoleItem,
    ...postItems,
    aboutItem,
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
      <section className="pb-16 pt-4 pl-5 sm:pb-24">
        <Reveal>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            I build stuff and sometimes do design, based in Stockholm and
            currently at Compileit.
          </p>
        </Reveal>
      </section>

      <section className="pb-40 sm:pb-44">
        <Reveal>
          <HomeList items={homeItems} />
        </Reveal>
      </section>
    </div>
  );
}
