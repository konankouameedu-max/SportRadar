"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import { usePwa } from "./PwaProvider";

/** Bouton d'installation : invite native (Android / Chrome / Edge), sinon lien vers le guide (iPhone, autres navigateurs). */
export function InstallAppButton({ className = "" }: { className?: string }) {
  const { canPrompt, installed, install } = usePwa();
  if (installed) return null;
  if (canPrompt)
    return <button onClick={install} className={`btn-primary ${className}`}><Smartphone size={18} aria-hidden /> Installer l&apos;application</button>;
  return <Link href="/application" className={`btn-outline-white ${className}`}><Smartphone size={18} aria-hidden /> Application mobile</Link>;
}
