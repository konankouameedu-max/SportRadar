"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { errorMessage, parisLocalToIso } from "@/lib/format";
import { geocode } from "@/lib/geocode";
import { CATEGORIES, LEVELS, type Activity } from "@/lib/types";

type Mode = { kind: "create"; coachId: string } | { kind: "edit"; activity: Activity };

export function ActivityForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const a = mode.kind === "edit" ? mode.activity : null;
  const [f, setF] = useState({
    title: a?.title ?? "", description: a?.description ?? "", category: a?.category ?? "Fitness", level: a?.level ?? "Tous niveaux",
    city: a?.city ?? "Paris", address: a?.address ?? "", duration_min: a?.duration_min ?? 60, max_participants: a?.max_participants ?? 10,
    status: a?.status ?? "published",
    latitude: a?.latitude ?? null as number | null, longitude: a?.longitude ?? null as number | null,
    firstDate: "", firstTime: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [geoInfo, setGeoInfo] = useState<string | null>(a?.latitude != null ? "Position enregistrée sur la carte." : null);
  const [saving, setSaving] = useState(false);

  const locate = async () => {
    setGeoInfo("Recherche de l'adresse…");
    const r = await geocode(f.address, f.city);
    if (!r) {
      setF((s) => ({ ...s, latitude: null, longitude: null }));
      return setGeoInfo("Adresse introuvable : l'activité sera publiée sans marqueur sur la carte.");
    }
    setF((s) => ({ ...s, latitude: r.lat, longitude: r.lng }));
    setGeoInfo(`📍 ${r.label}`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const er: Record<string, string> = {};
    if (f.title.trim().length < 3) er.title = "Le titre doit contenir au moins 3 caractères.";
    if (f.description.trim().length < 10) er.description = "La description doit contenir au moins 10 caractères.";
    if (f.city.trim().length < 2) er.city = "La ville est obligatoire.";
    if (!(f.duration_min >= 10 && f.duration_min <= 600)) er.duration_min = "Durée entre 10 et 600 minutes.";
    if (!(f.max_participants >= 1 && f.max_participants <= 200)) er.max_participants = "Entre 1 et 200 places.";
    if (mode.kind === "create" && (f.firstDate || f.firstTime)) {
      if (!f.firstDate || !f.firstTime) er.firstDate = "Indiquez la date et l'heure du premier créneau.";
      else if (new Date(parisLocalToIso(f.firstDate, f.firstTime)) <= new Date()) er.firstDate = "Le créneau doit être dans le futur.";
    }
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);

    let { latitude, longitude } = f;
    if (latitude == null && f.address.trim()) {
      const r = await geocode(f.address, f.city);
      if (r) ({ lat: latitude, lng: longitude } = r);
    }
    const row = {
      title: f.title.trim(), description: f.description.trim(), category: f.category, level: f.level, city: f.city.trim(),
      address: f.address.trim() || null, duration_min: f.duration_min, max_participants: f.max_participants, status: f.status, latitude, longitude,
    };
    const supabase = createClient();
    if (mode.kind === "create") {
      const { data, error } = await supabase.from("activities").insert({ ...row, coach_id: mode.coachId }).select().single();
      if (error) { setSaving(false); return setMsg({ ok: false, text: errorMessage(error, "Erreur lors de la publication") }); }
      if (f.firstDate && f.firstTime) {
        await supabase.from("activity_slots").insert({ activity_id: data.id, starts_at: parisLocalToIso(f.firstDate, f.firstTime), capacity: f.max_participants });
      }
      router.push(`/coach/activities/${data.id}?nouveau=1`);
      router.refresh();
    } else {
      const { error } = await supabase.from("activities").update(row).eq("id", mode.activity.id);
      setSaving(false);
      if (error) return setMsg({ ok: false, text: errorMessage(error) });
      setMsg({ ok: true, text: "Activité mise à jour." });
      router.refresh();
    }
  };

  const err = (k: string) => errors[k] && <p className="field-error">{errors[k]}</p>;

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 shadow-card md:p-6" noValidate>
      {msg && <div className={msg.ok ? "alert-success" : "alert-error"}>{msg.text}</div>}
      <div>
        <label htmlFor="title" className="label">Titre</label>
        <input id="title" className={`input ${errors.title ? "input-error" : ""}`} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex : Renforcement musculaire" />
        {err("title")}
      </div>
      <div>
        <label htmlFor="description" className="label">Description</label>
        <textarea id="description" className={`input min-h-[140px] ${errors.description ? "input-error" : ""}`} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Décrivez l'activité, le niveau, le matériel…" />
        {err("description")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="label">Catégorie</label>
          <select id="category" className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div>
          <label htmlFor="level" className="label">Niveau</label>
          <select id="level" className="input" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>{LEVELS.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div>
          <label htmlFor="address" className="label">Adresse du lieu</label>
          <input id="address" className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value, latitude: null, longitude: null })} placeholder="Ex : Parc Monceau, 35 bd de Courcelles" />
        </div>
        <div>
          <label htmlFor="city" className="label">Ville</label>
          <input id="city" className={`input ${errors.city ? "input-error" : ""}`} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value, latitude: null, longitude: null })} placeholder="Ex : Paris" />
          {err("city")}
        </div>
        <div className="sm:col-span-2">
          <button type="button" onClick={locate} className="btn-outline btn-sm"><MapPin size={16} /> Placer sur la carte</button>
          {geoInfo && <p className="mt-2 text-sm text-neutral-600" role="status">{geoInfo}</p>}
        </div>
        <div>
          <label htmlFor="duration" className="label">Durée (minutes)</label>
          <input id="duration" type="number" min={10} max={600} className={`input ${errors.duration_min ? "input-error" : ""}`} value={f.duration_min} onChange={(e) => setF({ ...f, duration_min: Number(e.target.value) })} />
          {err("duration_min")}
        </div>
        <div>
          <label htmlFor="max" className="label">Places par créneau (par défaut)</label>
          <input id="max" type="number" min={1} max={200} className={`input ${errors.max_participants ? "input-error" : ""}`} value={f.max_participants} onChange={(e) => setF({ ...f, max_participants: Number(e.target.value) })} />
          {err("max_participants")}
        </div>
        <div className="sm:col-span-2">
          <span className="label">Visibilité</span>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" checked={f.status === "published"} onChange={() => setF({ ...f, status: "published" })} /> Publiée (visible dans Découvrir)</label>
            <label className="flex items-center gap-2"><input type="radio" checked={f.status === "draft"} onChange={() => setF({ ...f, status: "draft" })} /> Brouillon</label>
          </div>
        </div>
      </div>
      {mode.kind === "create" && (
        <fieldset className="rounded-lg border border-dashed border-neutral-300 p-4">
          <legend className="px-1 text-sm font-medium">Premier créneau (facultatif)</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <input type="date" aria-label="Date du premier créneau" className="input" value={f.firstDate} onChange={(e) => setF({ ...f, firstDate: e.target.value })} />
            <input type="time" aria-label="Heure du premier créneau" className="input" value={f.firstTime} onChange={(e) => setF({ ...f, firstTime: e.target.value })} />
          </div>
          {err("firstDate")}
          <p className="mt-2 text-xs text-neutral-500">Vous pourrez ajouter d&apos;autres créneaux (y compris récurrents) à l&apos;étape suivante.</p>
        </fieldset>
      )}
      <button className="btn-primary w-full" disabled={saving}>{saving ? "Enregistrement..." : mode.kind === "create" ? "Publier" : "Enregistrer les modifications"}</button>
    </form>
  );
}
