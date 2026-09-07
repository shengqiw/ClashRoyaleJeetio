import type { MetadataRoute } from "next";
import { SITE_URL, PUBLIC_PAGES } from "@/lib/site";

// lastModified is the build time: Vercel rebuilds on every push to master, so
// "when the site last changed" is exactly right, and it's free.
const lastModified = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map(({ path }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
