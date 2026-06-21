import type { MetadataRoute } from "next";

/** Kanonik site adresi — Vercel geçici domaini asla kullanılmaz */
const BASE_URL = "https://www.marginalbridge.com";

type SitemapEntry = MetadataRoute.Sitemap[number];

interface PublicRoute {
  path: string;
  changeFrequency: NonNullable<SitemapEntry["changeFrequency"]>;
  priority: number;
}

/** Oturum gerektirmeyen, indekslenebilir sayfalar */
const PUBLIC_ROUTES: PublicRoute[] = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/login",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/register",
    changeFrequency: "monthly",
    priority: 0.8,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
