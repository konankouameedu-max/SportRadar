"use client";

import { useState } from "react";
import { CalendarDays, Clock, PlusCircle, Ticket, Timer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { errorMessage, fmtShortDate, fmtTime } from "@/lib/format";
import type { MyBooking } from "@/lib/queries";

export type PlanningItem = { id: string; name: string; type: string | null; date: string; time: string; duration: string | null };

export function PlanningClient({ initialItems, booked }: { initialItems: PlanningItem[]; booked: MyBooking[] }) {
  const [items, setItems] = useState(initialItems);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "", date: "", time: "", duration: "" });
  const [error, setError] = useState("");
  const supabase = createClient();

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.date || !form.time) return setError("Nom, date et heure sont obligatoires.");
    const { data, error: err } = await supabase.from("planning_items").insert({ ...form, name: form.name.trim(), type: form.type || null, duration: form.duration || null }).select().single();
    if (err) return setError("Échec de l'ajout de l'activité : " + errorMessage(err));
    setItems((l) => [...l, data as PlanningItem].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
    setForm({ name: "", type: "", date: "", time: "", duration: "" });
    setOpen(false);
  };

  const remove = async (id: string) => {
    const { error: err } = await supabase.from("planning_items").delete().eq("id", id);
    if (err) return setError("Échec de la suppression.");
    setItems((l) => l.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Mon planning</h1>
        <button onClick={() => setOpen((o) => !o)} className="btn-primary btn-sm"><PlusCircle size={18} /> Nouvelle activité</button>
      </div>

      {open && (
        <form onSubmit={add} className="grid gap-3 rounded-xl bg-white p-5 shadow-card sm:grid-cols-2">
          <input className="input" placeholder="Nom de l'activité" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required aria-label="Nom de l'activité" />
          <input className="input" placeholder="Type (ex : sport, bien-être...)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} aria-label="Type" />
          <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required aria-label="Date" />
          <input className="input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required aria-label="Heure" />
          <input className="input" placeholder="Durée (ex : 1h)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} aria-label="Durée" />
          <button type="submit" className="rounded-lg bg-green-600 py-2 text-white hover:bg-green-700">Ajouter</button>
        </form>
      )}
      {error && <div className="alert-error">{error}</div>}

      <div className="rounded-xl bg-white p-5 shadow-card">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Ticket size={18} aria-hidden /> Séances réservées</h2>
        {booked.length === 0 ? <p className="text-sm text-neutral-500">Aucune séance réservée à venir.</p> : (
          <ul className="space-y-2">
            {booked.map((b) => (
              <li key={b.id} className="flex flex-col justify-between gap-1 rounded-lg border bg-primary-50/50 p-3 sm:flex-row">
                <span className="font-medium">{b.slot.activity.title}</span>
                <span className="text-sm text-neutral-600">{fmtShortDate(b.slot.starts_at)} · {fmtTime(b.slot.starts_at)} · {b.slot.activity.duration_min} min</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl bg-white p-5 shadow-card">
        <h2 className="mb-3 text-lg font-semibold">Activités personnelles</h2>
        {items.length === 0 ? <p className="text-center text-neutral-500">Aucune activité planifiée pour le moment.</p> : (
          <ul className="space-y-3">
            {items.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <h3 className="text-base font-semibold md:text-lg">{t.name}{t.type && <span className="ml-2 text-sm font-normal text-neutral-500">({t.type})</span>}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                    <span className="flex items-center gap-1"><CalendarDays size={15} aria-hidden />{new Date(t.date + "T00:00:00").toLocaleDateString("fr-FR")}</span>
                    <span className="flex items-center gap-1"><Clock size={15} aria-hidden />{t.time.slice(0, 5)}</span>
                    {t.duration && <span className="flex items-center gap-1"><Timer size={15} aria-hidden />{t.duration}</span>}
                  </div>
                </div>
                <button onClick={() => remove(t.id)} className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-600 hover:bg-red-200">Supprimer</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
