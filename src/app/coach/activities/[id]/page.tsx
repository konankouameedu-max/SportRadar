import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Activity } from "@/lib/types";
import { ActivityForm } from "@/components/ActivityForm";
import { SlotManager, type CoachSlot } from "@/components/SlotManager";

export const metadata = { title: "Gérer l'activité" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nouveau?: string }> }) {
  const { id } = await params;
  const profile = await requireProfile(`/coach/activities/${id}`, ["coach"]);
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*, activity_slots(id, starts_at, capacity, bookings(participants, status))")
    .eq("id", id)
    .maybeSingle();
  if (!data || (data.coach_id !== profile.id && profile.role !== "admin")) notFound();
  const activity = data as Activity & { activity_slots: { id: string; starts_at: string; capacity: number; bookings: { participants: number; status: string }[] }[] };
  const slots: CoachSlot[] = activity.activity_slots
    .map((s) => ({ id: s.id, starts_at: s.starts_at, capacity: s.capacity, booked: s.bookings.filter((b) => b.status === "confirmed").reduce((t, b) => t + b.participants, 0) }))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const isNew = (await searchParams).nouveau === "1";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{activity.title}</h1>
          <p className="mt-1 text-neutral-600">Modifiez l&apos;activité et gérez ses créneaux.</p>
        </div>
        <Link href="/coach" className="btn-outline btn-sm">Retour</Link>
      </div>
      {isNew && <div className="alert-success">Activité publiée ! Ajoutez des créneaux pour que les utilisateurs puissent réserver.</div>}
      <SlotManager activityId={activity.id} defaultCapacity={activity.max_participants} slots={slots} />
      <ActivityForm mode={{ kind: "edit", activity }} />
    </div>
  );
}
