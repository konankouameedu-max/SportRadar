import type { SupabaseClient } from "@supabase/supabase-js";

export type MyBooking = {
  id: string;
  participants: number;
  status: "confirmed" | "cancelled";
  created_at: string;
  cgv_accepted_at: string;
  slot: { id: string; starts_at: string; activity: { id: string; title: string; city: string; address: string | null; duration_min: number; coach_name: string; category: string } };
};

export async function fetchMyBookings(supabase: SupabaseClient, userId: string): Promise<MyBooking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, participants, status, created_at, cgv_accepted_at, slot:activity_slots(id, starts_at, activity:activities(id, title, city, address, duration_min, coach_name, category))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as MyBooking[]).filter((b) => b.slot?.activity);
}
