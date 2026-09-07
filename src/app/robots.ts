import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Operator-only / passcode pages and the proxy API. They also carry
        // robots: noindex in their own layouts; this just saves crawlers the trip.
        disallow: ["/admin", "/meta-lab", "/test", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
