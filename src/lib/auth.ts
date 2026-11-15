import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import type { AccountType } from "@/lib/validation";

export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

/** Garde serveur : exige une connexion et, si précisé, un type de compte (l'admin passe toujours). */
export async function requireProfile(path: string, types?: AccountType[]): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (types && profile.role !== "admin" && !types.includes(profile.account_type)) redirect("/acces-refuse");
  return profile;
}
