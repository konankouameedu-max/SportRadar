"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Clock, LocateFixed, MapPin, Search, Signal, Users } from "lucide-react";
import { BookingModal } from "@/components/BookingModal";
import { fmtShortDate, fmtTime } from "@/lib/format";
import { CATEGORIES, type Activity, type SlotAvailability } from "@/lib/types";

const ActivityMap = dynamic(() => import("@/components/ActivityMap"), {
  ssr: false,
  loading: () => <div className="flex h-[360px] items-center justify-center bg-neutral-200 text-neutral-500 md:h-[520px]">Chargement de la carte…</div>,
});

export function DiscoverClient({ activities, slots, loadError }: { activities: Activity[]; slots: SlotAvailability[]; loadError: string | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  useEffect(() => {
    const id = params.get("activite");
    if (id) setSelected(activities.find((a) => a.id === id) ?? null);
  }, [params, activities]);

  const slotsBy = useMemo(() => {
    const m = new Map<string, SlotAvailability[]>();
    for (const s of slots) m.set(s.activity_id, [...(m.get(s.activity_id) ?? []), s]);
    return m;
  }, [slots]);

  const filtered = activities.filter((a) => {
    const text = `${a.title} ${a.description} ${a.city} ${a.coach_name} ${a.category}`.toLowerCase();
    const free = (slotsBy.get(a.id) ?? []).some((s) => s.remaining > 0);
    return (!q || text.includes(q.toLowerCase())) && (!category || a.category === category) && (!onlyAvailable || free);
  });

  const locate = () => {
    if (!navigator.geolocation) return setGeoMsg("La géolocalisation n'est pas supportée par votre navigateur.");
    setGeoMsg("Localisation en cours…");
    navigator.geolocation.getCurrentPosition(
      (p) => { setUserPos([p.coords.latitude, p.coords.longitude]); setGeoMsg(null); },
      () => setGeoMsg("Impossible d'obtenir votre position."),
      { timeout: 10000 },
    );
  };

  const close = () => {
    setSelected(null);
    if (params.get("activite")) router.replace("/discover", { scroll: false });
  };

  return (
    <div className="py-8 md:py-10">
      <div className="container-custom">
        <div className="mx-auto mb-6 max-w-3xl text-center">
          <h1 className="mb-2 text-2xl font-bold md:text-3xl">Découvrir les activités autour de vous</h1>
          <p className="text-neutral-600">
            Consultez la carte puis réservez une activité en choisissant une <strong>date</strong>, un <strong>créneau horaire</strong> et le <strong>nombre de participants</strong>.
          </p>
        </div>
        {loadError && <div className="alert-error mx-auto mb-6 max-w-3xl">{loadError}</div>}

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une activité, une ville, un coach…" className="input pl-10" aria-label="Rechercher" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input md:w-56" aria-label="Catégorie">
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 whitespace-nowrap text-sm">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="h-4 w-4" />
            Places disponibles
          </label>
          <button onClick={locate} className="btn-outline btn-sm whitespace-nowrap"><LocateFixed size={16} /> Me localiser</button>
        </div>
        {geoMsg && <p className="mb-3 text-sm text-neutral-600" role="status">{geoMsg}</p>}
      </div>

      <div className="mx-auto max-w-[1400px] px-0 sm:px-6">
        <div className="overflow-hidden shadow-card sm:rounded-2xl">
          <ActivityMap activities={filtered} userPos={userPos} onBook={setSelected} />
        </div>
      </div>

      <div className="container-custom mt-10">
        <h2 className="mb-4 text-xl font-bold md:text-2xl">Activités disponibles <span className="text-base font-normal text-neutral-500">({filtered.length})</span></h2>
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-card">
            <p className="text-neutral-600">{activities.length === 0 ? "Aucune activité n'est publiée pour le moment." : "Aucune activité ne correspond à votre recherche."}</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => {
              const s = slotsBy.get(a.id) ?? [];
              const next = s.find((x) => x.remaining > 0);
              const freeSlots = s.filter((x) => x.remaining > 0).length;
              return (
                <article key={a.id} className="flex flex-col rounded-xl bg-white p-5 shadow-card">
                  <div className="mb-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-primary-50 px-2 py-1 text-primary-700">{a.category}</span>
                    <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-neutral-700"><Signal size={12} aria-hidden />{a.level}</span>
                  </div>
                  <h3 className="text-lg md:text-xl">{a.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500">Coach : {a.coach_name}</p>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm text-neutral-700">{a.description}</p>
                  <ul className="mt-4 space-y-1 text-sm text-neutral-600">
                    <li className="flex items-center gap-2"><MapPin size={15} aria-hidden />{[a.address, a.city].filter(Boolean).join(", ")}</li>
                    <li className="flex items-center gap-2"><Clock size={15} aria-hidden />{a.duration_min} min</li>
                    <li className="flex items-center gap-2"><CalendarDays size={15} aria-hidden />
                      {next ? `Prochain créneau : ${fmtShortDate(next.starts_at)} à ${fmtTime(next.starts_at)}` : "Aucun créneau disponible"}
                    </li>
                    <li className="flex items-center gap-2"><Users size={15} aria-hidden />{freeSlots} créneau{freeSlots > 1 ? "x" : ""} disponible{freeSlots > 1 ? "s" : ""}</li>
                  </ul>
                  {a.latitude == null && <p className="mt-3 text-xs text-neutral-500">⚠️ Localisation non définie (pas de marqueur sur la carte).</p>}
                  <button onClick={() => setSelected(a)} className="btn-primary mt-5 w-full" disabled={!next}>
                    {next ? "Réserver (date + heure)" : "Complet / aucun créneau"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selected && <BookingModal activity={selected} onClose={close} onBooked={() => router.refresh()} />}
    </div>
  );
}
