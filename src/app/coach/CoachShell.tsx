"use client";

import { ClipboardList, LayoutDashboard, PlusCircle, User } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

const items = [
  { href: "/coach", label: "Mes activités", icon: LayoutDashboard, exact: true },
  { href: "/coach/publish", label: "Publier une activité", icon: PlusCircle },
  { href: "/coach/reservations", label: "Réservations reçues", icon: ClipboardList },
  { href: "/coach/profile", label: "Mon profil", icon: User },
];

export function CoachShell({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="Espace coach" items={items}>{children}</DashboardShell>;
}
