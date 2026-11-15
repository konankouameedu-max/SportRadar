"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "./AuthProvider";

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

export function DashboardShell({ title, items, children }: { title: string; items: NavItem[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/"));

  return (
    <div className="container-custom flex flex-col gap-6 py-6 md:flex-row md:py-10">
      <aside className="md:w-60 md:shrink-0">
        <div className="rounded-xl bg-white p-4 shadow-card">
          <div className="flex items-center justify-between md:block">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">{title}</p>
              <p className="truncate font-heading font-semibold">{profile ? `${profile.first_name} ${profile.last_name}` : ""}</p>
            </div>
            <button className="rounded p-2 text-neutral-700 hover:bg-neutral-100 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu de l'espace" aria-expanded={open}>
              <Menu size={20} />
            </button>
          </div>
          <nav className={`${open ? "block" : "hidden"} mt-4 space-y-1 md:block`} aria-label={title}>
            {items.map((i) => (
              <Link key={i.href} href={i.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive(i) ? "bg-primary-50 font-medium text-primary-700" : "text-neutral-700 hover:bg-neutral-50"}`}>
                <i.icon size={18} aria-hidden /> {i.label}
              </Link>
            ))}
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
              <LogOut size={18} aria-hidden /> Déconnexion
            </button>
          </nav>
        </div>
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
