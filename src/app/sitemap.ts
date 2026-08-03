import type { MetadataRoute } from "next";
import { getPagePosts } from "@/lib/content";

const SITE = "https://erikwijnbladh.com";

/**
 * Built from the same source as the routes themselves, so a new post can't be
 * added and then quietly left out of the sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPagePosts().map((post) => ({
    url: `${SITE}/${post.slug}`,
    lastModified: new Date(post.date),
    priority: 0.8,
  }));

  return [
    { url: SITE, lastModified: new Date(), priority: 1 },
    { url: `${SITE}/about`, lastModified: new Date(), priority: 0.6 },
    ...posts,
  ];
}
