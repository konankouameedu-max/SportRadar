"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/format";
import type { Activity } from "@/lib/types";

export function CoachActivityCard({ activity: a, upcomingSlots, booked, capacity }: { activity: Activity; upcomingSlots: number; booked: number; capacity: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggle = async () => {
    setBusy(true);
    const { error } = await createClient().from("activities").update({ status: a.status === "published" ? "draft" : "published" }).eq("id", a.id);
    setBusy(false);
    if (error) return setErr(errorMessage(error));
    router.refresh();
  };
  const remove = async () => {
    if (!confirm(`Supprimer « ${a.title} » ? Tous ses créneaux et réservations seront supprimés.`)) return;
    setBusy(true);
    const { error } = await createClient().from("activities").delete().eq("id", a.id);
    setBusy(false);
    if (error) return setErr(errorMessage(error, "Suppression impossible"));
    router.refresh();
  };

  return (
    <div className="flex flex-col rounded-xl bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl">{a.title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{a.city} • {a.duration_min} min • {a.category}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs ${a.status === "published" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-600"}`}>
          {a.status === "published" ? "Publiée" : "Brouillon"}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-neutral-700">{a.description}</p>
      <p className="mt-3 text-sm text-neutral-600">{upcomingSlots} créneau(x) à venir · {booked}/{capacity} places réservées</p>
      {upcomingSlots === 0 && <p className="mt-2 text-xs text-orange-700">⚠️ Sans créneau à venir, l&apos;activité ne peut pas être réservée.</p>}
      {err && <p className="field-error">{err}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/coach/activities/${a.id}`} className="btn-primary btn-sm">Modifier & créneaux</Link>
        <button onClick={toggle} disabled={busy} className="btn-outline btn-sm">{a.status === "published" ? "Dépublier" : "Publier"}</button>
        <button onClick={remove} disabled={busy} className="ml-auto text-sm text-red-600 hover:underline">Supprimer</button>
      </div>
    </div>
  );
}
