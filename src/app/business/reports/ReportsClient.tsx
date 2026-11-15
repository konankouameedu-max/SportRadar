"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, LineChart, PieChart as PieIcon, Table } from "lucide-react";
import type { Challenge, Employee } from "../types";

export function ReportsClient({ company, employees, challenges }: { company: string; employees: Employee[]; challenges: Challenge[] }) {
  const active = employees.filter((e) => e.active).length;
  const total = employees.reduce((s, e) => s + e.activities_count, 0);
  const inProgress = challenges.filter((c) => c.progress < c.goal).length;
  const chData = challenges.map((c) => ({ name: c.name.length > 18 ? c.name.slice(0, 17) + "…" : c.name, progression: Math.min(100, Math.round((c.progress / c.goal) * 100)) }));
  const pie = [{ name: "Actifs", value: active }, { name: "Inactifs", value: employees.length - active }];
  const topEmp = [...employees].sort((a, b) => b.activities_count - a.activities_count).slice(0, 8).map((e) => ({ name: `${e.first_name} ${e.last_name.charAt(0)}.`, activités: e.activities_count }));

  const exportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [
      ["Rapport SportRadar", company, new Date().toLocaleDateString("fr-FR")],
      [],
      ["Indicateur", "Valeur"],
      ["Employés inscrits", employees.length], ["Employés actifs", active], ["Activités totales", total], ["Défis en cours", inProgress],
      [],
      ["Employé", "Email", "Statut", "Activités"],
      ...employees.map((e) => [`${e.first_name} ${e.last_name}`, e.email, e.active ? "Actif" : "Inactif", e.activities_count]),
      [],
      ["Défi", "Objectif", "Unité", "Progression", "%"],
      ...challenges.map((c) => [c.name, c.goal, c.unit, c.progress, Math.round((c.progress / c.goal) * 100)]),
    ];
    const blob = new Blob(["﻿" + lines.map((l) => l.map(esc).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rapport-sportradar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Rapports et Analyses</h1>
        <button onClick={exportCsv} className="btn-primary btn-sm"><Download size={16} /> Exporter le rapport</button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="mb-4 flex items-center text-lg font-semibold"><LineChart className="mr-2 h-5 w-5 text-primary-600" />Activités par employé</h2>
          {topEmp.length === 0 ? <p className="text-sm text-neutral-500">Aucune donnée.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topEmp}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="activités" fill="#0ea5e9" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="mb-4 flex items-center text-lg font-semibold"><PieIcon className="mr-2 h-5 w-5 text-secondary-600" />Participation</h2>
          {employees.length === 0 ? <p className="text-sm text-neutral-500">Aucune donnée.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>{pie.map((_, i) => <Cell key={i} fill={i === 0 ? "#22c55e" : "#d4d4d4"} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="mb-4 flex items-center text-lg font-semibold"><LineChart className="mr-2 h-5 w-5 text-primary-600" />Progression des défis (%)</h2>
          {chData.length === 0 ? <p className="text-sm text-neutral-500">Aucun défi.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chData} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" domain={[0, 100]} /><YAxis type="category" dataKey="name" width={120} fontSize={12} /><Tooltip /><Bar dataKey="progression" fill="#00BCD4" radius={[0, 4, 4, 0]} /></BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="mb-4 flex items-center text-lg font-semibold"><Table className="mr-2 h-5 w-5 text-secondary-600" />Synthèse de l&apos;entreprise</h2>
          <table className="w-full text-sm"><tbody>
            <tr className="border-b"><td className="py-2 font-medium">Employés inscrits</td><td>{employees.length}</td></tr>
            <tr className="border-b"><td className="py-2 font-medium">Employés actifs</td><td>{active}</td></tr>
            <tr className="border-b"><td className="py-2 font-medium">Activités totales</td><td>{total}</td></tr>
            <tr className="border-b"><td className="py-2 font-medium">Défis en cours</td><td>{inProgress}</td></tr>
            <tr><td className="py-2 font-medium">Défis relevés</td><td>{challenges.length - inProgress}</td></tr>
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
