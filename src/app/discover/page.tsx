import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Activity, SlotAvailability } from "@/lib/types";
import { DiscoverClient } from "./DiscoverClient";

export const metadata: Metadata = { title: "Découvrir les activités", description: "Carte des activités sportives près de chez vous : réservez une date, un créneau et le nombre de participants." };
export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const [{ data: activities, error }, { data: slots }] = await Promise.all([
    supabase.from("activities").select("*").eq("status", "published").order("created_at", { ascending: false }),
    supabase.rpc("slot_availability"),
  ]);
  return (
    <DiscoverClient
      activities={(activities as Activity[]) ?? []}
      slots={(slots as SlotAvailability[]) ?? []}
      loadError={error ? "Impossible de charger les activités. Veuillez réessayer dans quelques instants." : null}
    />
  );
}
