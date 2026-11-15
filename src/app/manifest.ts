import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SportRadar — Bougez localement, vivez mieux",
    short_name: "SportRadar",
    description: "Trouvez et réservez des activités sportives près de chez vous.",
    lang: "fr",
    dir: "ltr",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#0369a1",
    categories: ["sports", "health", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Découvrir les activités", short_name: "Découvrir", url: "/discover", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Mes réservations", short_name: "Réservations", url: "/dashboard/reservations", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
