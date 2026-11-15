"use client";

import { usePwa } from "@/components/PwaProvider";

export function InstallPrompt() {
  const { canPrompt, installed, isIos, install } = usePwa();
  if (installed) return <div className="alert-success mt-6">✅ L&apos;application est installée sur cet appareil.</div>;
  if (canPrompt) return <button onClick={install} className="btn-primary mt-6 w-full sm:w-auto">Installer l&apos;application</button>;
  if (isIos) return <div className="alert-info mt-6">Sur iPhone, l&apos;installation se fait depuis Safari : suivez les 3 étapes ci-dessous.</div>;
  return null;
}
