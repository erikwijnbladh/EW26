import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type PostMeta = {
  slug: string;
  title: string;
  subtitle: string;
  preview: string;
  /** Named PostShader scene. When set, it replaces the `preview` gradient. */
  shader?: string;
  /**
   * Demo clip for the home page hover preview, as a path under `public/`.
   * Outranks `shader` and `preview` when present. Optional on purpose: a post
   * with nothing to demo (an essay) is correctly served by its shader, so this
   * is only ever set on the posts where a recording says something a still
   * can't.
   */
  video?: string;
  date: string;
  /** External URL. When set, the post opens this link and has no detail page. */
  link?: string;
};

export type Post = PostMeta & { body: string };

function readPost(slug: string): Post {
  const file = fs.readFileSync(path.join(CONTENT_DIR, `${slug}.mdx`), "utf8");
  const { data, content } = matter(file);
  return {
    slug,
    title: data.title,
    subtitle: data.subtitle,
    preview: data.preview,
    shader: data.shader,
    video: data.video,
    date: data.date instanceof Date ? data.date.toISOString() : String(data.date),
    link: data.link,
    body: content,
  };
}

/** All posts, newest first. */
export function getAllPosts(): Post[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => readPost(f.replace(/\.mdx$/, "")))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

/** Posts that render their own detail page (no external link). */
export function getPagePosts(): Post[] {
  return getAllPosts().filter((p) => !p.link);
}

export function getPost(slug: string): Post | undefined {
  try {
    return readPost(slug);
  } catch {
    return undefined;
  }
}
