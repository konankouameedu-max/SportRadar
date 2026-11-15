"use client";

import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, writeConsent, type Consent } from "@/lib/consent";

export default function CookiesPage() {
  const [consent, setConsent] = useState<Consent>(null);
  useEffect(() => {
    const sync = () => setConsent(readConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  const status =
    consent === "accepted" ? "✅ Cookies acceptés" : consent === "refused" ? "❌ Cookies refusés" : "ℹ️ Aucun choix enregistré";

  return (
    <div className="container-custom max-w-3xl py-12 md:py-16">
      <div className="rounded-xl bg-white p-6 shadow-card md:p-10">
        <h1 className="mb-4 text-3xl md:text-4xl">Gestion des cookies</h1>
        <p className="mb-4 text-neutral-700">Vous pouvez accepter ou refuser l&apos;utilisation des cookies. Votre choix est enregistré dans votre navigateur.</p>
        <p className="mb-4 text-sm text-neutral-600">Les cookies strictement nécessaires (maintien de votre session de connexion) sont toujours actifs : sans eux, la connexion est impossible.</p>
        <p className="mb-6 font-medium">Statut actuel : <span aria-live="polite">{status}</span></p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => writeConsent("accepted")} className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">Accepter</button>
          <button onClick={() => writeConsent("refused")} className="rounded-lg bg-neutral-700 px-4 py-2 text-white hover:bg-neutral-600">Refuser</button>
          <button onClick={() => writeConsent(null)} className="btn-outline btn-sm">Réinitialiser</button>
        </div>
      </div>
    </div>
  );
}
