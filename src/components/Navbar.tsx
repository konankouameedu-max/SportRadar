"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "./AuthProvider";
import { dashboardPathFor } from "@/lib/types";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/discover", label: "Découvrir" },
  { href: "/business-info", label: "Entreprise" },
  { href: "/devenir-coach", label: "Coachs / Associations" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  useEffect(() => setOpen(false), [pathname]);

  const linkCls = (href: string) =>
    `font-medium transition-colors hover:text-primary-600 ${
      (href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "text-primary-700" : "text-neutral-700"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white shadow-sm">
      <nav className="container-custom flex h-16 items-center justify-between md:h-20" aria-label="Navigation principale">
        <Link href="/" aria-label="SportRadar, accueil">
          <Logo />
        </Link>

        <div className="hidden items-center gap-6 lg:flex lg:gap-8">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
          {profile ? (
            <>
              <Link href={dashboardPathFor(profile)} className="font-medium text-primary-700 hover:text-primary-800">
                Mon Espace
              </Link>
              <button onClick={logout} className="btn-outline btn-sm">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-medium text-primary-700 hover:text-primary-800">
                Connexion
              </Link>
              <Link href="/register" className="btn-primary">
                Je m&apos;inscris
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-neutral-100 bg-white lg:hidden">
          <div className="container-custom flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={`rounded-md px-3 py-2 ${linkCls(l.href)}`}>
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-neutral-100 pt-4">
              {profile ? (
                <>
                  <Link href={dashboardPathFor(profile)} className="btn-primary">Mon Espace</Link>
                  <button onClick={logout} className="btn-outline">Déconnexion</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-outline">Connexion</Link>
                  <Link href="/register" className="btn-primary">Je m&apos;inscris</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
