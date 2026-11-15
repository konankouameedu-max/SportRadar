import Link from "next/link";
import { CalendarCheck, Clock, Flame, Award } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchMyBookings } from "@/lib/queries";
import { fmtShortDate, fmtTime } from "@/lib/format";
import { Stat } from "@/components/Stat";
import { Weather } from "./Weather";

export const metadata = { title: "Tableau de bord" };

export default async function UserDashboard({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const profile = await requireProfile("/dashboard");
  const supabase = await createClient();
  const [bookings, { count: badgeCount }] = await Promise.all([
    fetchMyBookings(supabase, profile.id),
    supabase.from("user_badges").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
  ]);
  const now = Date.now();
  const active = bookings.filter((b) => b.status === "confirmed");
  const upcoming = active.filter((b) => new Date(b.slot.starts_at).getTime() > now).sort((a, b) => a.slot.starts_at.localeCompare(b.slot.starts_at));
  const done = active.filter((b) => new Date(b.slot.starts_at).getTime() <= now);
  const hours = Math.round(done.reduce((s, b) => s + b.slot.activity.duration_min, 0) / 6) / 10;
  const welcome = (await searchParams).bienvenue === "1";

  return (
    <div className="space-y-6">
      {welcome && <div className="alert-success">Bienvenue sur SportRadar ! Votre compte est créé.</div>}
      <h1 className="text-2xl font-bold md:text-3xl">Bienvenue, {profile.first_name}</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={CalendarCheck} label="Séances à venir" value={upcoming.length} />
        <Stat icon={Flame} label="Séances réalisées" value={done.length} tone="orange" />
        <Stat icon={Clock} label="Heures de sport" value={`${hours} h`} tone="green" />
        <Stat icon={Award} label="Badges" value={badgeCount ?? 0} tone="violet" />
      </div>
      <Weather />
      <div className="rounded-xl bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold md:text-xl">Mes prochaines séances</h2>
          <Link href="/discover" className="btn-primary btn-sm">Réserver une activité</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="py-4 text-center text-neutral-500">Aucune activité planifiée pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {upcoming.slice(0, 5).map((b) => (
              <li key={b.id} className="flex flex-col justify-between gap-1 rounded-lg border bg-neutral-50 p-3 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold">{b.slot.activity.title}</p>
                  <p className="text-sm text-neutral-500">{b.slot.activity.city} · {b.participants} participant{b.participants > 1 ? "s" : ""}</p>
                </div>
                <p className="text-sm font-medium text-primary-700">{fmtShortDate(b.slot.starts_at)} à {fmtTime(b.slot.starts_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
