import type { MetadataRoute } from "next";
import { GAMES } from "@/lib/games";
import { OCCASIONS } from "@/lib/occasions";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const gameSlugs = GAMES.filter((g) => g.status === "available").map((g) => g.slug);
  const occasionSlugs = OCCASIONS.map((o) => o.slug);

  return [
    // Core marketing
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1, lastModified: now },
    { url: `${SITE_URL}/games`, changeFrequency: "weekly", priority: 0.9, lastModified: now },
    { url: `${SITE_URL}/how-it-works`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${SITE_URL}/virtual-host`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${SITE_URL}/pricing`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${SITE_URL}/occasions`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${SITE_URL}/help`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3, lastModified: now },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3, lastModified: now },

    // Individual game pages
    ...gameSlugs.map((slug) => ({
      url: `${SITE_URL}/games/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.85,
      lastModified: now,
    })),

    // Occasion pages
    ...occasionSlugs.map((slug) => ({
      url: `${SITE_URL}/occasions/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.65,
      lastModified: now,
    })),
  ];
}
