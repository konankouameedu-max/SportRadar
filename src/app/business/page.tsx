import Link from "next/link";
import { Activity, ChevronRight, Trophy, Users, UserCheck } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Stat } from "@/components/Stat";
import type { Challenge, Employee } from "./types";

export const metadata = { title: "Tableau de bord entreprise" };

export default async function BusinessDashboard({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const profile = await requireProfile("/business", ["entreprise"]);
  const supabase = await createClient();
  const [{ data: emps }, { data: chs }] = await Promise.all([
    supabase.from("employees").select("*").eq("business_id", profile.id),
    supabase.from("challenges").select("*").eq("business_id", profile.id).order("created_at", { ascending: false }),
  ]);
  const employees = (emps as Employee[]) ?? [];
  const challenges = (chs as Challenge[]) ?? [];
  const active = employees.filter((e) => e.active);
  const total = employees.reduce((s, e) => s + e.activities_count, 0);
  const inProgress = challenges.filter((c) => c.progress < c.goal);
  const top = [...employees].sort((a, b) => b.activities_count - a.activities_count).filter((e) => e.activities_count > 0).slice(0, 5);
  const welcome = (await searchParams).bienvenue === "1";

  return (
    <div className="space-y-6">
      {welcome && <div className="alert-success">Bienvenue ! Votre compte entreprise est créé : ajoutez vos employés et lancez un premier défi.</div>}
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Tableau de bord entreprise</h1>
        <p className="text-neutral-600">{profile.company_name} — vue d&apos;ensemble de votre activité</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Employés inscrits" value={employees.length} />
        <Stat icon={UserCheck} label="Employés actifs" value={active.length} hint={employees.length ? `${Math.round((active.length / employees.length) * 100)} % de participation` : "Aucune donnée"} tone="green" />
        <Stat icon={Activity} label="Activités réalisées" value={total} tone="orange" />
        <Stat icon={Trophy} label="Défis en cours" value={inProgress.length} tone="violet" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold md:text-xl">Défis en cours</h2>
            <Link href="/business/challenges" className="flex items-center text-sm text-primary-700 hover:underline">Voir tous les défis <ChevronRight size={16} /></Link>
          </div>
          {inProgress.length === 0 ? <p className="text-sm text-neutral-500">Aucun défi actif pour le moment.</p> : (
            <ul className="space-y-4">
              {inProgress.slice(0, 4).map((c) => {
                const pct = Math.min(100, Math.round((c.progress / c.goal) * 100));
                return (
                  <li key={c.id}>
                    <div className="flex justify-between text-sm"><span className="font-medium">{c.name}</span><span className="text-neutral-500">{c.progress}/{c.goal} {c.unit.toLowerCase()}</span></div>
                    <div className="mt-1 h-2 rounded-full bg-neutral-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-2 rounded-full bg-primary-500" style={{ width: `${pct}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="rounded-xl bg-white p-5 shadow-card">
          <h2 className="mb-4 text-lg font-semibold md:text-xl">Employés les plus actifs</h2>
          {top.length === 0 ? <p className="text-sm text-neutral-500">Pas encore d&apos;activités enregistrées.</p> : (
            <ul className="divide-y">
              {top.map((e, i) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <span><span className="mr-2 text-neutral-400">#{i + 1}</span>{e.first_name} {e.last_name}</span>
                  <span className="text-sm font-semibold">{e.activities_count} <span className="text-xs font-normal text-neutral-500">activités</span></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
