import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchMyBookings } from "@/lib/queries";
import { ProfileEditor } from "@/components/ProfileEditor";

export const metadata = { title: "Mon profil" };

function weekIndex(d: Date) {
  return Math.floor(d.getTime() / (7 * 24 * 3600 * 1000));
}

export default async function Page() {
  const profile = await requireProfile("/dashboard/profile");
  const bookings = (await fetchMyBookings(await createClient(), profile.id)).filter((b) => b.status === "confirmed");
  const now = new Date();
  const done = bookings.filter((b) => new Date(b.slot.starts_at) <= now);
  const weeks = new Set(done.map((b) => weekIndex(new Date(b.slot.starts_at))));
  let streak = 0;
  for (let w = weekIndex(now); weeks.has(w) || (w === weekIndex(now) && streak === 0 && weeks.has(w - 1)); w--) if (weeks.has(w)) streak++;
  const stats = {
    completed: done.length,
    hours: Math.round(done.reduce((s, b) => s + b.slot.activity.duration_min, 0) / 6) / 10,
    upcoming: bookings.length - done.length,
    streak,
  };
  return <ProfileEditor profile={profile} stats={stats} />;
}
