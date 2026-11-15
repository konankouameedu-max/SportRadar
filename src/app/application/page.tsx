import type { Metadata } from "next";
import { Download, MoreVertical, PlusSquare, Share } from "lucide-react";
import { InstallPrompt } from "./InstallPrompt";

export const metadata: Metadata = { title: "Application mobile", description: "Installez SportRadar sur votre téléphone (Android et iPhone)." };

export default function AppPage() {
  return (
    <div className="container-custom max-w-3xl py-12 md:py-16">
      <div className="rounded-xl bg-white p-6 shadow-card md:p-10">
        <h1 className="mb-3 text-3xl md:text-4xl">L&apos;application SportRadar</h1>
        <p className="text-neutral-600">
          Installez SportRadar sur votre téléphone : une icône sur l&apos;écran d&apos;accueil, l&apos;application en plein écran et vos réservations à portée de main.
          Gratuit, sans passer par un store, toujours à jour.
        </p>
        <InstallPrompt />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border p-5">
            <h2 className="mb-3 text-xl">📱 iPhone / iPad (Safari)</h2>
            <ol className="space-y-2 text-sm text-neutral-700">
              <li><span className="mr-1 font-semibold">1.</span> Ouvrez ce site dans <strong>Safari</strong>.</li>
              <li><span className="mr-1 font-semibold">2.</span> Touchez <Share size={16} className="mx-0.5 inline align-text-bottom text-primary-600" aria-label="Partager" /> <strong>Partager</strong>.</li>
              <li><span className="mr-1 font-semibold">3.</span> Choisissez <PlusSquare size={16} className="mx-0.5 inline align-text-bottom text-primary-600" aria-hidden /> <strong>Sur l&apos;écran d&apos;accueil</strong>, puis <strong>Ajouter</strong>.</li>
            </ol>
          </section>
          <section className="rounded-xl border p-5">
            <h2 className="mb-3 text-xl">🤖 Android (Chrome)</h2>
            <ol className="space-y-2 text-sm text-neutral-700">
              <li><span className="mr-1 font-semibold">1.</span> Touchez le bouton <Download size={16} className="mx-0.5 inline align-text-bottom text-primary-600" aria-hidden /> <strong>Installer l&apos;application</strong> ci-dessus,</li>
              <li><span className="mr-1 font-semibold">2.</span> ou le menu <MoreVertical size={16} className="mx-0.5 inline align-text-bottom text-primary-600" aria-label="menu" /> puis <strong>Installer l&apos;application</strong>.</li>
              <li><span className="mr-1 font-semibold">3.</span> L&apos;icône SportRadar apparaît sur votre écran d&apos;accueil.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
