import type { Metadata, Viewport } from "next";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/600.css";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { getSessionProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "SportRadar - Bougez localement, vivez mieux", template: "%s | SportRadar" },
  description:
    "SportRadar vous aide à trouver et réserver des activités sportives près de chez vous. Une plateforme qui connecte particuliers, coachs et associations.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0369a1" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <AuthProvider initialProfile={profile}>
          <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
            Aller au contenu
          </a>
          <Navbar />
          <main id="contenu" className="flex-1">{children}</main>
          <Footer />
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
