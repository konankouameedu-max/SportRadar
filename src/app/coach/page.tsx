import Link from "next/link";
import { CalendarDays, ClipboardList, LayoutList, Users } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Activity } from "@/lib/types";
import { Stat } from "@/components/Stat";
import { CoachActivityCard } from "./CoachActivityCard";

export const metadata = { title: "Espace coach" };

type Row = Activity & { activity_slots: { id: string; starts_at: string; capacity: number; bookings: { participants: number; status: string }[] }[] };

export default async function CoachDashboard({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const profile = await requireProfile("/coach", ["coach"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*, activity_slots(id, starts_at, capacity, bookings(participants, status))")
    .eq("coach_id", profile.id)
    .order("created_at", { ascending: false });
  const rows = (data as Row[]) ?? [];
  const now = Date.now();
  const future = rows.flatMap((a) => a.activity_slots.filter((s) => new Date(s.starts_at).getTime() > now));
  const confirmed = rows.flatMap((a) => a.activity_slots.flatMap((s) => s.bookings.filter((b) => b.status === "confirmed")));
  const welcome = (await searchParams).bienvenue === "1";

  return (
    <div className="space-y-6">
      {welcome && <div className="alert-success">Bienvenue ! Votre compte coach est créé : publiez votre première activité.</div>}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Espace Coach</h1>
          <p className="mt-1 text-neutral-600">Gérez vos activités publiées (elles apparaissent aussi dans Découvrir).</p>
        </div>
        <Link href="/coach/publish" className="btn-primary">+ Publier une activité</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={LayoutList} label="Activités" value={rows.length} hint={`${rows.filter((r) => r.status === "published").length} publiée(s)`} />
        <Stat icon={CalendarDays} label="Créneaux à venir" value={future.length} tone="violet" />
        <Stat icon={ClipboardList} label="Réservations" value={confirmed.length} tone="green" />
        <Stat icon={Users} label="Participants" value={confirmed.reduce((s, b) => s + b.participants, 0)} tone="orange" />
      </div>
      {error && <div className="alert-error">Erreur lors du chargement des activités.</div>}
      {rows.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-card">
          <p className="text-neutral-600">Aucune activité publiée pour le moment.</p>
          <Link href="/coach/publish" className="btn-primary mt-4">Publier ma première activité</Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {rows.map((a) => {
            const slots = a.activity_slots.filter((s) => new Date(s.starts_at).getTime() > now);
            const booked = slots.reduce((s, x) => s + x.bookings.filter((b) => b.status === "confirmed").reduce((t, b) => t + b.participants, 0), 0);
            const capacity = slots.reduce((s, x) => s + x.capacity, 0);
            return <CoachActivityCard key={a.id} activity={a} upcomingSlots={slots.length} booked={booked} capacity={capacity} />;
          })}
        </div>
      )}
    </div>
  );
}
