"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, LayoutList, Mail, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/format";
import type { Activity, Profile } from "@/lib/types";
import { Stat } from "@/components/Stat";

type App = { id: string; structure_name: string; structure_type: string; sports: string; message: string | null; status: string; created_at: string; user_id: string };
type Msg = { id: string; name: string; email: string; subject: string; message: string; created_at: string };
const TYPE = { particulier: "Particulier", coach: "Coach", entreprise: "Entreprise" } as const;

export function AdminClient({ users, activities, bookingCount, applications, messages }: { users: Profile[]; activities: Activity[]; bookingCount: number; applications: App[]; messages: Msg[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "activities" | "apps" | "messages">("users");
  const [err, setErr] = useState<string | null>(null);
  const supabase = createClient();
  const run = async (p: PromiseLike<{ error: unknown }>) => {
    const { error } = await p;
    if (error) setErr(errorMessage(error));
    else router.refresh();
  };

  const tabs = { users: `Utilisateurs (${users.length})`, activities: `Activités (${activities.length})`, apps: `Dossiers partenaires (${applications.length})`, messages: `Messages (${messages.length})` };

  return (
    <div className="container-custom space-y-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Espace Administrateur</h1>
          <p className="text-neutral-600">Gestion des utilisateurs, activités, dossiers et messages.</p>
        </div>
        <button onClick={() => router.refresh()} className="btn-outline btn-sm">Recharger</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Utilisateurs" value={users.length} />
        <Stat icon={LayoutList} label="Activités" value={activities.length} tone="violet" />
        <Stat icon={CalendarCheck} label="Réservations actives" value={bookingCount} tone="green" />
        <Stat icon={Mail} label="Messages" value={messages.length} tone="orange" />
      </div>
      {err && <div className="alert-error">{err}</div>}
      <div className="flex flex-wrap gap-2 border-b" role="tablist">
        {(Object.keys(tabs) as (keyof typeof tabs)[]).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? "border-primary-600 font-medium text-primary-700" : "border-transparent text-neutral-600"}`}>{tabs[k]}</button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-card">
        {tab === "users" && (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b text-neutral-500"><th className="py-2">Nom</th><th>Email</th><th>Type</th><th>SIRET</th><th>Rôle</th><th>Inscription</th></tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-2">{u.first_name} {u.last_name}{u.company_name && <span className="block text-xs text-neutral-500">{u.company_name}</span>}</td>
                <td>{u.email}</td><td>{TYPE[u.account_type]}</td><td className="font-mono text-xs">{u.siret ?? "—"}</td>
                <td>
                  <select value={u.role} onChange={(e) => run(supabase.from("profiles").update({ role: e.target.value }).eq("id", u.id))} className="rounded border px-2 py-1" aria-label="Rôle">
                    <option value="user">user</option><option value="admin">admin</option>
                  </select>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {tab === "activities" && (
          activities.length === 0 ? <p className="text-neutral-500">Aucune activité.</p> :
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b text-neutral-500"><th className="py-2">Titre</th><th>Coach</th><th>Ville</th><th>Statut</th><th className="sr-only">Actions</th></tr></thead>
            <tbody>{activities.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{a.title}</td><td>{a.coach_name}</td><td>{a.city}</td>
                <td>
                  <select value={a.status} onChange={(e) => run(supabase.from("activities").update({ status: e.target.value }).eq("id", a.id))} className="rounded border px-2 py-1" aria-label="Statut">
                    <option value="published">Publiée</option><option value="draft">Brouillon</option><option value="archived">Archivée</option>
                  </select>
                </td>
                <td className="text-right"><button onClick={() => confirm("Supprimer cette activité ?") && run(supabase.from("activities").delete().eq("id", a.id))} className="text-red-600 hover:underline">Supprimer</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {tab === "apps" && (
          applications.length === 0 ? <p className="text-neutral-500">Aucun dossier.</p> :
          <ul className="divide-y">{applications.map((a) => (
            <li key={a.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
              <div><p className="font-medium">{a.structure_name} <span className="text-sm font-normal text-neutral-500">({a.structure_type})</span></p><p className="text-sm text-neutral-600">{a.sports}{a.message && ` — ${a.message}`}</p></div>
              <select value={a.status} onChange={(e) => run(supabase.from("partner_applications").update({ status: e.target.value }).eq("id", a.id))} className="rounded border px-2 py-1 text-sm" aria-label="Statut du dossier">
                <option>en attente</option><option>validé</option><option>refusé</option>
              </select>
            </li>
          ))}</ul>
        )}
        {tab === "messages" && (
          messages.length === 0 ? <p className="text-neutral-500">Aucun message.</p> :
          <ul className="divide-y">{messages.map((m) => (
            <li key={m.id} className="py-3"><p className="font-medium">{m.subject} <span className="text-sm font-normal text-neutral-500">— {m.name} &lt;{m.email}&gt; · {new Date(m.created_at).toLocaleString("fr-FR")}</span></p><p className="mt-1 whitespace-pre-line text-sm text-neutral-700">{m.message}</p></li>
          ))}</ul>
        )}
      </div>
      <p className="text-xs text-neutral-500">* Accès protégé côté base de données (règles RLS) : seuls les administrateurs voient ces données.</p>
    </div>
  );
}
