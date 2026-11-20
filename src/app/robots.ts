import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Espaces connectés et pages techniques : rien à indexer
        disallow: ["/dashboard", "/coach$", "/coach/", "/business$", "/business/", "/admin", "/acces-refuse", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
