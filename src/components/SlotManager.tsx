"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { errorMessage, fmtDate, fmtTime, parisLocalToIso } from "@/lib/format";

export type CoachSlot = { id: string; starts_at: string; capacity: number; booked: number };

export function SlotManager({ activityId, defaultCapacity, slots }: { activityId: string; defaultCapacity: number; slots: CoachSlot[] }) {
  const router = useRouter();
  const [f, setF] = useState({ date: "", time: "", capacity: defaultCapacity, repeat: 1 });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const upcoming = slots.filter((s) => new Date(s.starts_at).getTime() > now);
  const past = slots.filter((s) => new Date(s.starts_at).getTime() <= now);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!f.date || !f.time) return setMsg({ ok: false, text: "Indiquez une date et une heure." });
    if (f.capacity < 1 || f.capacity > 200) return setMsg({ ok: false, text: "Le nombre de places doit être compris entre 1 et 200." });
    if (f.repeat < 1 || f.repeat > 26) return setMsg({ ok: false, text: "Répétition : entre 1 et 26 semaines." });
    const first = new Date(parisLocalToIso(f.date, f.time));
    if (first.getTime() <= Date.now()) return setMsg({ ok: false, text: "Le créneau doit être dans le futur." });
    const rows = Array.from({ length: f.repeat }, (_, i) => {
      const d = new Date(`${f.date}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 7 * i);
      return { activity_id: activityId, starts_at: parisLocalToIso(d.toISOString().slice(0, 10), f.time), capacity: f.capacity };
    });
    setBusy(true);
    const { error } = await createClient().from("activity_slots").upsert(rows, { onConflict: "activity_id,starts_at", ignoreDuplicates: true });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: errorMessage(error) });
    setMsg({ ok: true, text: `${rows.length} créneau${rows.length > 1 ? "x ajoutés" : " ajouté"}.` });
    router.refresh();
  };

  const updateCapacity = async (s: CoachSlot, capacity: number) => {
    if (capacity < Math.max(1, s.booked)) return setMsg({ ok: false, text: `Impossible : ${s.booked} place(s) déjà réservée(s) sur ce créneau.` });
    const { error } = await createClient().from("activity_slots").update({ capacity }).eq("id", s.id);
    setMsg(error ? { ok: false, text: errorMessage(error) } : { ok: true, text: "Capacité mise à jour." });
    router.refresh();
  };

  const remove = async (s: CoachSlot) => {
    const warn = s.booked > 0 ? `\n⚠️ ${s.booked} place(s) réservée(s) seront annulées.` : "";
    if (!confirm(`Supprimer le créneau du ${fmtDate(s.starts_at)} à ${fmtTime(s.starts_at)} ?${warn}`)) return;
    const { error } = await createClient().from("activity_slots").delete().eq("id", s.id);
    setMsg(error ? { ok: false, text: errorMessage(error) } : { ok: true, text: "Créneau supprimé." });
    router.refresh();
  };

  return (
    <div className="space-y-4 rounded-xl bg-white p-5 shadow-card md:p-6">
      <h2 className="text-xl md:text-2xl">Créneaux & disponibilités</h2>
      <form onSubmit={add} className="grid gap-3 rounded-lg bg-neutral-50 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div><label htmlFor="sd" className="label">Date</label><input id="sd" type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div><label htmlFor="st" className="label">Heure</label><input id="st" type="time" className="input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div>
        <div><label htmlFor="sc" className="label">Places</label><input id="sc" type="number" min={1} max={200} className="input" value={f.capacity} onChange={(e) => setF({ ...f, capacity: Number(e.target.value) })} /></div>
        <div><label htmlFor="sr" className="label">Répéter (semaines)</label><input id="sr" type="number" min={1} max={26} className="input" value={f.repeat} onChange={(e) => setF({ ...f, repeat: Number(e.target.value) })} /></div>
        <button className="btn-primary" disabled={busy}><CalendarPlus size={16} /> Ajouter</button>
      </form>
      {msg && <div className={msg.ok ? "alert-success" : "alert-error"} role="status">{msg.text}</div>}

      {upcoming.length === 0 ? (
        <p className="text-sm text-neutral-500">Aucun créneau à venir : ajoutez-en pour permettre les réservations.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr className="border-b text-neutral-500"><th className="py-2">Date</th><th>Heure</th><th>Réservées</th><th>Places</th><th className="sr-only">Actions</th></tr></thead>
            <tbody>
              {upcoming.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2">{fmtDate(s.starts_at)}</td>
                  <td>{fmtTime(s.starts_at)}</td>
                  <td>
                    <span className={s.booked >= s.capacity ? "font-semibold text-red-600" : ""}>{s.booked} / {s.capacity}</span>
                    {s.booked >= s.capacity && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Complet</span>}
                  </td>
                  <td>
                    <input type="number" min={Math.max(1, s.booked)} max={200} defaultValue={s.capacity} aria-label="Capacité"
                      onBlur={(e) => Number(e.target.value) !== s.capacity && updateCapacity(s, Number(e.target.value))} className="input w-20 py-1" />
                  </td>
                  <td className="text-right">
                    <button onClick={() => remove(s)} className="rounded p-2 text-red-600 hover:bg-red-50" aria-label="Supprimer le créneau"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {past.length > 0 && <p className="text-xs text-neutral-500">{past.length} créneau(x) passé(s) masqué(s).</p>}
    </div>
  );
}
