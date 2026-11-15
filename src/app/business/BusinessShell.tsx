"use client";

import { BarChart3, LayoutDashboard, Trophy, User, Users } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

const items = [
  { href: "/business", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/business/employees", label: "Employés", icon: Users },
  { href: "/business/challenges", label: "Défis", icon: Trophy },
  { href: "/business/reports", label: "Rapports", icon: BarChart3 },
  { href: "/business/profile", label: "Mon profil", icon: User },
];

export function BusinessShell({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="Espace entreprise" items={items}>{children}</DashboardShell>;
}
