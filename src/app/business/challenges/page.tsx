import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Challenge } from "../types";
import { ChallengesClient } from "./ChallengesClient";

export const metadata = { title: "Défis d'entreprise" };

export default async function Page() {
  const profile = await requireProfile("/business/challenges", ["entreprise"]);
  const { data } = await (await createClient()).from("challenges").select("*").eq("business_id", profile.id).order("created_at", { ascending: false });
  return <ChallengesClient initial={(data as Challenge[]) ?? []} />;
}
