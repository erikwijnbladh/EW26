import type { MetadataRoute } from "next";

const SITE = "https://erikwijnbladh.com";

/** One page. The detail that used to live on its own routes is in the chat. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE, lastModified: new Date(), priority: 1 }];
}
