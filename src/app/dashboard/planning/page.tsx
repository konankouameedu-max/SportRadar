import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchMyBookings } from "@/lib/queries";
import { PlanningClient, type PlanningItem } from "./PlanningClient";

export const metadata = { title: "Mon planning" };

export default async function Page() {
  const profile = await requireProfile("/dashboard/planning");
  const supabase = await createClient();
  const [{ data: items }, bookings] = await Promise.all([
    supabase.from("planning_items").select("*").order("date").order("time"),
    fetchMyBookings(supabase, profile.id),
  ]);
  const booked = bookings.filter((b) => b.status === "confirmed" && new Date(b.slot.starts_at) > new Date());
  return <PlanningClient initialItems={(items as PlanningItem[]) ?? []} booked={booked} />;
}
