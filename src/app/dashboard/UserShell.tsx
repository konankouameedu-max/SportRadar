"use client";

import { Award, CalendarDays, LayoutDashboard, Ticket, User } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

const items = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/reservations", label: "Mes réservations", icon: Ticket },
  { href: "/dashboard/planning", label: "Mon planning", icon: CalendarDays },
  { href: "/dashboard/profile", label: "Mon profil", icon: User },
  { href: "/dashboard/badges", label: "Mes badges", icon: Award },
];

export function UserShell({ children }: { children: React.ReactNode }) {
  return <DashboardShell title="Mon espace" items={items}>{children}</DashboardShell>;
}
