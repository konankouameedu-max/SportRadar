"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/format";
import type { Challenge } from "../types";

const UNITS = ["Pas", "Kilomètres", "Heures", "Activités"] as const;
const blank = { name: "", description: "", goal: 10, unit: "Activités" as Challenge["unit"], progress: 0 };

export function ChallengesClient({ initial }: { initial: Challenge[] }) {
  const [list, setList] = useState(initial);
  const [f, setF] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const supabase = createClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (f.name.trim().length < 2) return setErr("Le nom du défi est obligatoire.");
    if (!(f.goal > 0)) return setErr("L'objectif doit être supérieur à 0.");
    if (f.progress < 0) return setErr("La progression ne peut pas être négative.");
    const row = { name: f.name.trim(), description: f.description.trim() || null, goal: f.goal, unit: f.unit, progress: f.progress };
    const q = editing ? supabase.from("challenges").update(row).eq("id", editing).select().single() : supabase.from("challenges").insert(row).select().single();
    const { data, error } = await q;
    if (error) return setErr(errorMessage(error));
    setList((l) => (editing ? l.map((c) => (c.id === editing ? (data as Challenge) : c)) : [data as Challenge, ...l]));
    setF(blank); setEditing(null); setShow(false);
  };

  const edit = (c: Challenge) => {
    setF({ name: c.name, description: c.description ?? "", goal: c.goal, unit: c.unit, progress: c.progress });
    setEditing(c.id); setShow(true);
  };
  const remove = async (id: string) => {
    if (!confirm("Supprimer ce défi ?")) return;
    const { error } = await supabase.from("challenges").delete().eq("id", id);
    if (error) return setErr(errorMessage(error));
    setList((l) => l.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Défis d&apos;entreprise</h1>
        <button onClick={() => { setShow((s) => !s); setEditing(null); setF(blank); }} className="btn-primary btn-sm"><Plus size={16} /> Créer un défi</button>
      </div>
      {err && <div className="alert-error">{err}</div>}
      {show && (
        <form onSubmit={submit} className="grid gap-3 rounded-xl bg-white p-5 shadow-card sm:grid-cols-2" noValidate>
          <h2 className="text-lg font-semibold sm:col-span-2">{editing ? "Modifier un défi" : "Créer un défi"}</h2>
          <input className="input sm:col-span-2" placeholder="Nom du défi" aria-label="Nom du défi" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <textarea className="input sm:col-span-2" placeholder="Description" aria-label="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <div><label className="label" htmlFor="goal">Objectif</label><input id="goal" type="number" min={1} className="input" value={f.goal} onChange={(e) => setF({ ...f, goal: Number(e.target.value) })} /></div>
          <div><label className="label" htmlFor="unit">Unité</label><select id="unit" className="input" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value as Challenge["unit"] })}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
          <div><label className="label" htmlFor="prog">Progression actuelle</label><input id="prog" type="number" min={0} className="input" value={f.progress} onChange={(e) => setF({ ...f, progress: Number(e.target.value) })} /></div>
          <div className="flex items-end gap-2">
            <button className="btn-primary btn-sm flex-1">{editing ? "Mettre à jour" : "Créer"}</button>
            <button type="button" onClick={() => { setShow(false); setEditing(null); }} className="btn-outline btn-sm flex-1">Annuler</button>
          </div>
        </form>
      )}
      {list.length === 0 ? <p className="rounded-xl bg-white p-8 text-center text-neutral-500 shadow-card">Aucun défi pour le moment.</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((c) => {
            const pct = Math.min(100, Math.round((c.progress / c.goal) * 100));
            return (
              <div key={c.id} className="rounded-xl bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg">{c.name}</h2>
                    <p className="mt-1 text-sm text-neutral-600">{c.description || "Aucune description"}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => edit(c)} className="rounded p-2 text-neutral-600 hover:bg-neutral-100" aria-label="Modifier"><Pencil size={16} /></button>
                    <button onClick={() => remove(c.id)} className="rounded p-2 text-red-600 hover:bg-red-50" aria-label="Supprimer"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm"><span>{c.progress} / {c.goal} {c.unit.toLowerCase()}</span><span className="font-semibold">{pct}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-neutral-100"><div className={`h-2 rounded-full ${pct >= 100 ? "bg-green-500" : "bg-primary-500"}`} style={{ width: `${pct}%` }} /></div>
                {pct >= 100 && <p className="mt-2 text-sm font-medium text-green-700">🎉 Défi relevé !</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
