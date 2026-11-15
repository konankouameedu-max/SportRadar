import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Activity, Profile } from "@/lib/types";
import { AdminClient } from "./AdminClient";

export const metadata = { title: "Espace administrateur" };

export default async function AdminPage() {
  const profile = await requireProfile("/admin");
  if (profile.role !== "admin") {
    const { redirect } = await import("next/navigation");
    redirect("/acces-refuse");
  }
  const supabase = await createClient();
  const [{ data: users }, { data: activities }, { data: bookings }, { data: apps }, { data: messages }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("activities").select("*").order("created_at", { ascending: false }),
    supabase.from("bookings").select("id, status, participants"),
    supabase.from("partner_applications").select("*").order("created_at", { ascending: false }),
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <AdminClient
      users={(users as Profile[]) ?? []}
      activities={(activities as Activity[]) ?? []}
      bookingCount={(bookings ?? []).filter((b) => b.status === "confirmed").length}
      applications={apps ?? []}
      messages={messages ?? []}
    />
  );
}
