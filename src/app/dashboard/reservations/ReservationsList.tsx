"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { errorMessage, fmtDate, fmtTime } from "@/lib/format";
import type { MyBooking } from "@/lib/queries";

export function ReservationsList({ bookings }: { bookings: MyBooking[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const now = Date.now();

  const groups = {
    upcoming: bookings.filter((b) => b.status === "confirmed" && new Date(b.slot.starts_at).getTime() > now).sort((a, b) => a.slot.starts_at.localeCompare(b.slot.starts_at)),
    past: bookings.filter((b) => b.status === "confirmed" && new Date(b.slot.starts_at).getTime() <= now),
    cancelled: bookings.filter((b) => b.status === "cancelled"),
  };

  const cancel = async (id: string) => {
    if (!confirm("Annuler cette réservation ? Les places seront libérées.")) return;
    setBusy(id);
    const { error } = await createClient().rpc("cancel_booking", { p_booking: id });
    setBusy(null);
    setMsg(error ? { type: "err", text: errorMessage(error) } : { type: "ok", text: "Réservation annulée." });
    router.refresh();
  };

  const labels = { upcoming: "À venir", past: "Passées", cancelled: "Annulées" } as const;
  const list = groups[tab];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Mes réservations</h1>
        <Link href="/discover" className="btn-primary btn-sm">Nouvelle réservation</Link>
      </div>
      {msg && <div className={msg.type === "ok" ? "alert-success" : "alert-error"}>{msg.text}</div>}
      <div className="flex gap-2 border-b" role="tablist">
        {(Object.keys(labels) as (keyof typeof labels)[]).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? "border-primary-600 font-medium text-primary-700" : "border-transparent text-neutral-600 hover:text-neutral-800"}`}>
            {labels[k]} ({groups[k].length})
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-neutral-500 shadow-card">Aucune réservation dans cette catégorie.</p>
      ) : (
        <ul className="space-y-4">
          {list.map((b) => (
            <li key={b.id} className="rounded-xl bg-white p-5 shadow-card">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs text-neutral-500">N° {b.id.slice(0, 8).toUpperCase()} · {b.slot.activity.category}</p>
                  <h2 className="text-lg md:text-xl">{b.slot.activity.title}</h2>
                  <p className="text-sm text-neutral-500">Coach : {b.slot.activity.coach_name}</p>
                  <ul className="mt-3 grid gap-1 text-sm text-neutral-700 sm:grid-cols-2">
                    <li className="flex items-center gap-2"><CalendarDays size={15} aria-hidden />{fmtDate(b.slot.starts_at)}</li>
                    <li className="flex items-center gap-2"><Clock size={15} aria-hidden />{fmtTime(b.slot.starts_at)} · {b.slot.activity.duration_min} min</li>
                    <li className="flex items-center gap-2"><MapPin size={15} aria-hidden />{[b.slot.activity.address, b.slot.activity.city].filter(Boolean).join(", ")}</li>
                    <li className="flex items-center gap-2"><Users size={15} aria-hidden />{b.participants} participant{b.participants > 1 ? "s" : ""}</li>
                  </ul>
                </div>
                {tab === "upcoming" && (
                  <button onClick={() => cancel(b.id)} disabled={busy === b.id} className="rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 hover:bg-red-200 disabled:opacity-50">
                    {busy === b.id ? "Annulation..." : "Annuler"}
                  </button>
                )}
                {tab === "cancelled" && <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">Annulée</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
