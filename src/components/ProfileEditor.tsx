"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Flame, Pen, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/format";
import type { Profile } from "@/lib/types";
import { isValidFrenchPhone, isValidPostalCode, isValidSiretOrSiren, normalizeDigits } from "@/lib/validation";
import { useAuth } from "./AuthProvider";

type Stats = { completed: number; hours: number; upcoming: number; streak: number };

const TYPE_LABEL = { particulier: "Particulier", coach: "Coach / Association", entreprise: "Entreprise" } as const;

export function ProfileEditor({ profile, stats }: { profile: Profile; stats?: Stats }) {
  const router = useRouter();
  const { refresh, logout } = useAuth();
  const isPro = profile.account_type !== "particulier";
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone ?? "", siret: profile.siret ?? "",
    company_name: profile.company_name ?? "", address_line: profile.address_line ?? "", postal_code: profile.postal_code ?? "", city: profile.city ?? "",
    goals: profile.goals.join(", "),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!form.first_name.trim()) er.first_name = "Le prénom est obligatoire.";
    if (!form.last_name.trim()) er.last_name = "Le nom est obligatoire.";
    if (isPro) {
      if (!isValidFrenchPhone(form.phone)) er.phone = "Numéro de téléphone invalide.";
      if (!isValidSiretOrSiren(form.siret)) er.siret = "SIRET/SIREN invalide.";
      if (form.address_line.trim().length < 5) er.address_line = "Adresse obligatoire.";
      if (!isValidPostalCode(form.postal_code)) er.postal_code = "Code postal à 5 chiffres.";
      if (form.city.trim().length < 2) er.city = "Ville obligatoire.";
      if (profile.account_type === "entreprise" && form.company_name.trim().length < 2) er.company_name = "Nom de l'entreprise obligatoire.";
    }
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    const update: Partial<Profile> = {
      first_name: form.first_name.trim(), last_name: form.last_name.trim(),
      goals: form.goals.split(",").map((g) => g.trim()).filter(Boolean).slice(0, 10),
      ...(isPro && {
        phone: normalizeDigits(form.phone), siret: normalizeDigits(form.siret), address_line: form.address_line.trim(),
        postal_code: form.postal_code.trim(), city: form.city.trim(),
        ...(profile.account_type === "entreprise" && { company_name: form.company_name.trim() }),
      }),
    };
    const { error } = await createClient().from("profiles").update(update).eq("id", profile.id);
    setSaving(false);
    if (error) return setMsg({ ok: false, text: errorMessage(error) });
    setMsg({ ok: true, text: "Profil mis à jour." });
    setEditing(false);
    await refresh();
    router.refresh();
  };

  const deleteAccount = async () => {
    if (!confirm("Supprimer définitivement votre compte et toutes vos données (réservations, activités…) ? Cette action est irréversible.")) return;
    const { error } = await createClient().rpc("delete_my_account");
    if (error) return setMsg({ ok: false, text: errorMessage(error) });
    await logout();
  };

  const input = (k: keyof typeof form, label: string, full = false) => (
    <div className={full ? "sm:col-span-2" : ""}>
      <label htmlFor={k} className="label">{label}</label>
      <input id={k} className={`input ${errors[k] ? "input-error" : ""}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );

  const rows: [string, string | null][] = [
    ["Type de compte", TYPE_LABEL[profile.account_type]],
    ...(profile.account_type === "entreprise" ? [["Entreprise", profile.company_name] as [string, string | null]] : []),
    ["E-mail", profile.email],
    ...(isPro ? ([["Téléphone", profile.phone], ["SIRET / SIREN", profile.siret], ["Adresse", [profile.address_line, `${profile.postal_code ?? ""} ${profile.city ?? ""}`.trim()].filter(Boolean).join(", ")]] as [string, string | null][]) : []),
    ["Membre depuis", new Date(profile.created_at).toLocaleDateString("fr-FR")],
  ];

  return (
    <div className="space-y-4 text-neutral-700">
      <div className="flex items-center rounded-xl bg-white p-5 shadow-card">
        <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50"><User className="h-8 w-8 text-primary-700" aria-hidden /></div>
        <h1 className="text-2xl font-bold md:text-3xl">Bonjour {profile.first_name} {profile.last_name} 👋</h1>
      </div>
      {msg && <div className={msg.ok ? "alert-success" : "alert-error"}>{msg.text}</div>}

      {!editing ? (
        <>
          <div className="rounded-xl bg-white p-5 shadow-card">
            <h2 className="mb-3 text-lg font-bold md:text-xl">Mes informations</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}><dt className="text-neutral-500">{k}</dt><dd className="font-medium">{v || "—"}</dd></div>
              ))}
            </dl>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-card">
            <h2 className="mb-2 text-lg font-bold md:text-xl">Mes objectifs</h2>
            <div className="flex flex-wrap gap-2">
              {profile.goals.length ? profile.goals.map((g) => <span key={g} className="rounded-full bg-primary-600 px-3 py-1 text-sm text-white">{g}</span>) : <span className="text-sm text-neutral-500">Aucun objectif.</span>}
            </div>
          </div>
          {stats && (
            <div className="grid gap-4 rounded-xl bg-white p-5 shadow-card sm:grid-cols-2">
              <div className="flex items-center"><CheckCircle2 className="mr-2 h-6 w-6 text-green-500" aria-hidden />{stats.completed} activités terminées</div>
              <div className="flex items-center"><Clock className="mr-2 h-6 w-6 text-primary-500" aria-hidden />{stats.hours} h au total</div>
              <div className="flex items-center"><CheckCircle2 className="mr-2 h-6 w-6 text-orange-500" aria-hidden />{stats.upcoming} séances à venir</div>
              <div className="flex items-center"><Flame className="mr-2 h-6 w-6 text-red-500" aria-hidden />{stats.streak} semaines actives consécutives</div>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <button onClick={() => setEditing(true)} className="btn-primary btn-sm"><Pen size={16} /> Modifier</button>
          </div>
        </>
      ) : (
        <form onSubmit={save} className="grid gap-4 rounded-xl bg-white p-5 shadow-card sm:grid-cols-2" noValidate>
          {profile.account_type === "entreprise" && input("company_name", "Nom de l'entreprise", true)}
          {input("first_name", profile.account_type === "entreprise" ? "Prénom du représentant" : "Prénom")}
          {input("last_name", profile.account_type === "entreprise" ? "Nom du représentant" : "Nom")}
          {isPro && (<>{input("phone", "Téléphone")}{input("siret", "SIRET / SIREN")}{input("address_line", "Adresse", true)}{input("postal_code", "Code postal")}{input("city", "Ville")}</>)}
          {input("goals", "Objectifs (séparés par des virgules)", true)}
          <p className="text-xs text-neutral-500 sm:col-span-2">L&apos;adresse e-mail et le type de compte ne sont pas modifiables. Contactez-nous si nécessaire.</p>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => setEditing(false)} className="btn-outline btn-sm"><X size={16} /> Annuler</button>
            <button className="btn-primary btn-sm" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
          </div>
        </form>
      )}

      <details className="rounded-xl border border-red-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-medium text-red-700">Supprimer mon compte (RGPD)</summary>
        <p className="mt-3 text-sm text-neutral-600">Toutes vos données personnelles, réservations et activités publiées seront définitivement supprimées.</p>
        <button onClick={deleteAccount} className="btn-danger btn-sm mt-3">Supprimer définitivement mon compte</button>
      </details>
    </div>
  );
}
