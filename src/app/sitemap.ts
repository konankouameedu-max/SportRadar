import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

type Entree = { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] };

// Pages publiques uniquement (les espaces connectés sont exclus dans robots.ts)
const PAGES: Entree[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/discover", priority: 0.9, changeFrequency: "daily" },
  { path: "/devenir-coach", priority: 0.8, changeFrequency: "monthly" },
  { path: "/coachs-associations", priority: 0.7, changeFrequency: "monthly" },
  { path: "/business-info", priority: 0.8, changeFrequency: "monthly" },
  { path: "/register", priority: 0.6, changeFrequency: "yearly" },
  { path: "/login", priority: 0.4, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/application", priority: 0.5, changeFrequency: "monthly" },
  { path: "/cgv", priority: 0.3, changeFrequency: "yearly" },
  { path: "/mentions-legales", priority: 0.3, changeFrequency: "yearly" },
  { path: "/confidentialite", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
