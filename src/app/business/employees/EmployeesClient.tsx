"use client";

import { useState } from "react";
import { Search, Trash2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/format";
import { isValidEmail } from "@/lib/validation";
import { Modal } from "@/components/Modal";
import type { Employee } from "../types";

export function EmployeesClient({ initial }: { initial: Employee[] }) {
  const [list, setList] = useState(initial);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ first_name: "", last_name: "", email: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  const shown = list.filter((e) => `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(q.toLowerCase()));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!f.first_name.trim() || !f.last_name.trim()) return setErr("Prénom et nom obligatoires.");
    if (!isValidEmail(f.email)) return setErr("Adresse e-mail invalide.");
    setBusy(true);
    const { data, error } = await supabase.from("employees").insert({ first_name: f.first_name.trim(), last_name: f.last_name.trim(), email: f.email.trim().toLowerCase() }).select().single();
    setBusy(false);
    if (error) return setErr(error.code === "23505" ? "Cet employé est déjà enregistré." : errorMessage(error, "Erreur lors de l'ajout."));
    setList((l) => [...l, data as Employee]);
    setF({ first_name: "", last_name: "", email: "" });
    setOpen(false);
  };

  const patch = async (emp: Employee, change: Partial<Employee>) => {
    const { error } = await supabase.from("employees").update(change).eq("id", emp.id);
    if (error) return setErr(errorMessage(error));
    setList((l) => l.map((x) => (x.id === emp.id ? { ...x, ...change } : x)));
  };

  const remove = async (emp: Employee) => {
    if (!confirm(`Retirer ${emp.first_name} ${emp.last_name} ?`)) return;
    const { error } = await supabase.from("employees").delete().eq("id", emp.id);
    if (error) return setErr(errorMessage(error));
    setList((l) => l.filter((x) => x.id !== emp.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-neutral-700 md:text-3xl">Employés inscrits</h1>
        <button onClick={() => setOpen(true)} className="btn-primary btn-sm"><UserPlus size={16} /> Ajouter un employé</button>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un employé..." className="input pl-10" aria-label="Rechercher un employé" />
      </div>
      {err && !open && <div className="alert-error">{err}</div>}
      <div className="overflow-x-auto rounded-xl bg-white shadow-card">
        {shown.length === 0 ? <p className="p-6 text-center text-neutral-500">Aucun employé trouvé.</p> : (
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead><tr className="border-b text-neutral-500"><th className="p-3">Nom</th><th>Email</th><th>Activités</th><th>Statut</th><th className="sr-only">Actions</th></tr></thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{e.first_name} {e.last_name}</td>
                  <td>{e.email}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => patch(e, { activities_count: Math.max(0, e.activities_count - 1) })} className="h-7 w-7 rounded border hover:bg-neutral-50" aria-label="Retirer une activité">−</button>
                      <span className="w-8 text-center">{e.activities_count}</span>
                      <button onClick={() => patch(e, { activities_count: e.activities_count + 1 })} className="h-7 w-7 rounded border hover:bg-neutral-50" aria-label="Ajouter une activité">+</button>
                    </div>
                  </td>
                  <td>
                    <button onClick={() => patch(e, { active: !e.active })} className={`rounded-full px-3 py-1 text-xs ${e.active ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-600"}`}>
                      {e.active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="pr-3 text-right"><button onClick={() => remove(e)} className="rounded p-2 text-red-600 hover:bg-red-50" aria-label="Retirer l'employé"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {open && (
        <Modal title="Ajouter un employé" onClose={() => { setOpen(false); setErr(null); }}>
          <form onSubmit={add} className="space-y-4" noValidate>
            {err && <div className="alert-error text-sm">{err}</div>}
            <div><label className="label" htmlFor="ef">Prénom</label><input id="ef" className="input" value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} /></div>
            <div><label className="label" htmlFor="el">Nom</label><input id="el" className="input" value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></div>
            <div><label className="label" htmlFor="ee">Email</label><input id="ee" type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Ajout..." : "Ajouter"}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
