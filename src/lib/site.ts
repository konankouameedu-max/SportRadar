/** Adresse publique du site, utilisée pour le sitemap et le robots.txt. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportradar-app.vercel.app").replace(/\/$/, "");
