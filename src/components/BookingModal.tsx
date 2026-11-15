"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, MapPin, User, Users } from "lucide-react";
import { Modal } from "./Modal";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { dayKey, errorMessage, fmtDate, fmtShortDate, fmtTime } from "@/lib/format";
import type { Activity, Booking, SlotAvailability } from "@/lib/types";

export function BookingModal({ activity, onClose, onBooked }: { activity: Activity; onClose: () => void; onBooked: () => void }) {
  const { profile } = useAuth();
  const [slots, setSlots] = useState<SlotAvailability[] | null>(null);
  const [day, setDay] = useState("");
  const [slotId, setSlotId] = useState("");
  const [participants, setParticipants] = useState(1);
  const [cgv, setCgv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  const load = async () => {
    const { data, error: err } = await createClient().rpc("slot_availability", { p_activity: activity.id });
    if (err) setError(errorMessage(err));
    setSlots((data as SlotAvailability[]) ?? []);
  };
  useEffect(() => { void load(); }, [activity.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => [...new Set((slots ?? []).map((s) => dayKey(s.starts_at)))], [slots]);
  const daySlots = (slots ?? []).filter((s) => dayKey(s.starts_at) === day);
  const slot = (slots ?? []).find((s) => s.slot_id === slotId);
  const maxP = Math.max(1, Math.min(10, slot?.remaining ?? 10));

  useEffect(() => { if (!day && days.length) setDay(days[0]); }, [days, day]);
  useEffect(() => { setSlotId(""); }, [day]);
  useEffect(() => { if (participants > maxP) setParticipants(maxP); }, [maxP, participants]);

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!day) return setError("Veuillez sélectionner une date pour réserver.");
    if (!slot) return setError("Veuillez choisir un créneau horaire.");
    if (slot.remaining <= 0) return setError("Ce créneau est complet.");
    if (participants < 1 || participants > maxP) return setError(`Veuillez choisir un nombre de participants valide (1 à ${maxP}).`);
    if (!cgv) return setError("Vous devez accepter les conditions générales de vente pour confirmer la réservation.");
    setLoading(true);
    const { data, error: err } = await createClient().rpc("book_slot", { p_slot: slot.slot_id, p_participants: participants, p_accept_cgv: true });
    setLoading(false);
    if (err) {
      setError(errorMessage(err));
      void load();
      return;
    }
    setBooking(data as Booking);
    onBooked();
  };

  if (booking && slot) {
    return (
      <Modal title="Réservation confirmée" onClose={onClose}>
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" aria-hidden />
          <p className="mt-3 text-neutral-700">Votre place est réservée. Voici le récapitulatif :</p>
        </div>
        <dl className="mt-5 space-y-2 rounded-lg bg-neutral-50 p-4 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-neutral-500">Activité</dt><dd className="text-right font-medium">{activity.title}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-neutral-500">Coach</dt><dd className="text-right">{activity.coach_name}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-neutral-500">Date</dt><dd className="text-right">{fmtDate(slot.starts_at)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-neutral-500">Heure</dt><dd className="text-right">{fmtTime(slot.starts_at)} ({activity.duration_min} min)</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-neutral-500">Lieu</dt><dd className="text-right">{[activity.address, activity.city].filter(Boolean).join(", ")}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-neutral-500">Participants</dt><dd className="text-right">{booking.participants}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-neutral-500">Montant</dt><dd className="text-right">Gratuit</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-neutral-500">N° de réservation</dt><dd className="text-right font-mono text-xs">{booking.id.slice(0, 8).toUpperCase()}</dd></div>
        </dl>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link href="/dashboard/reservations" className="btn-primary flex-1">Voir mes réservations</Link>
          <button onClick={onClose} className="btn-outline flex-1">Continuer</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Réserver : ${activity.title}`} onClose={onClose}>
      <p className="-mt-2 mb-4 text-sm text-neutral-600">Choisissez une date, un créneau horaire et le nombre de participants.</p>
      <ul className="mb-4 space-y-1 text-sm text-neutral-700">
        <li className="flex items-center gap-2"><User size={15} aria-hidden /> Coach : {activity.coach_name}</li>
        <li className="flex items-center gap-2"><MapPin size={15} aria-hidden /> Lieu : {[activity.address, activity.city].filter(Boolean).join(", ")}</li>
        <li className="flex items-center gap-2"><Clock size={15} aria-hidden /> Durée : {activity.duration_min} min</li>
      </ul>

      {!profile && (
        <div className="alert-info mb-4 text-sm">
          Vous pouvez préparer votre réservation, mais la confirmation nécessite une connexion.{" "}
          <Link href={`/login?next=${encodeURIComponent(`/discover?activite=${activity.id}`)}`} className="font-semibold underline">Se connecter</Link> ou{" "}
          <Link href="/register" className="font-semibold underline">créer un compte</Link>.
        </div>
      )}

      {slots === null ? (
        <p className="text-neutral-600">Chargement des disponibilités…</p>
      ) : slots.length === 0 ? (
        <div className="alert-info">Aucun créneau à venir pour cette activité. Revenez bientôt !</div>
      ) : (
        <form onSubmit={confirm} className="space-y-4" noValidate>
          <div>
            <label htmlFor="day" className="label">Date</label>
            <select id="day" className="input" value={day} onChange={(e) => setDay(e.target.value)}>
              {days.map((d) => {
                const first = slots.find((s) => dayKey(s.starts_at) === d)!;
                return <option key={d} value={d}>{fmtShortDate(first.starts_at)}</option>;
              })}
            </select>
          </div>
          <div>
            <span className="label">Créneau horaire</span>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {daySlots.map((s) => (
                <button key={s.slot_id} type="button" disabled={s.remaining <= 0} onClick={() => setSlotId(s.slot_id)}
                  aria-pressed={slotId === s.slot_id}
                  className={`rounded-lg border px-2 py-2 text-sm ${slotId === s.slot_id ? "border-primary-600 bg-primary-600 text-white" : "border-neutral-300 hover:border-primary-400"} disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400`}>
                  <span className="block font-medium">{fmtTime(s.starts_at)}</span>
                  <span className="block text-xs">{s.remaining > 0 ? `${s.remaining} place${s.remaining > 1 ? "s" : ""}` : "Complet"}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="participants" className="label flex items-center gap-1"><Users size={15} aria-hidden /> Nombre de participants</label>
            <input id="participants" type="number" min={1} max={maxP} value={participants} onChange={(e) => setParticipants(Number(e.target.value))} className="input" />
            <p className="mt-1 text-xs text-neutral-500">Maximum {maxP} pour ce créneau.</p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={cgv} onChange={(e) => setCgv(e.target.checked)} className="mt-0.5 h-4 w-4" required />
            <span>J&apos;ai lu et j&apos;accepte les <Link href="/cgv" target="_blank" className="text-primary-700 underline">conditions générales de vente</Link>. <span className="text-red-500">*</span></span>
          </label>
          {error && <div className="alert-error text-sm" role="alert">{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={loading || !profile || !cgv}>
            {loading ? "Réservation..." : "Confirmer la réservation"}
          </button>
        </form>
      )}
    </Modal>
  );
}
