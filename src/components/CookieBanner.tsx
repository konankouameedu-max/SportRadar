"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, writeConsent } from "@/lib/consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(readConsent() === null);
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!visible) return null;
  return (
    <div role="region" aria-label="Consentement aux cookies" className="fixed inset-x-0 bottom-0 z-50 bg-neutral-900 p-4 text-white">
      <div className="container-custom flex flex-col items-start justify-between gap-3 text-sm sm:flex-row sm:items-center">
        <p>
          Nous utilisons des cookies pour améliorer votre expérience.{" "}
          <Link href="/cookies" className="underline">Gérer mes cookies</Link>
        </p>
        <div className="flex gap-2">
          <button onClick={() => writeConsent("refused")} className="rounded bg-neutral-700 px-4 py-2 hover:bg-neutral-600">Refuser</button>
          <button onClick={() => writeConsent("accepted")} className="rounded bg-green-600 px-4 py-2 hover:bg-green-700">Accepter</button>
        </div>
      </div>
    </div>
  );
}
