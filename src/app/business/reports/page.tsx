import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Challenge, Employee } from "../types";
import { ReportsClient } from "./ReportsClient";

export const metadata = { title: "Rapports et analyses" };

export default async function Page() {
  const profile = await requireProfile("/business/reports", ["entreprise"]);
  const supabase = await createClient();
  const [{ data: e }, { data: c }] = await Promise.all([
    supabase.from("employees").select("*").eq("business_id", profile.id),
    supabase.from("challenges").select("*").eq("business_id", profile.id),
  ]);
  return <ReportsClient company={profile.company_name ?? "Entreprise"} employees={(e as Employee[]) ?? []} challenges={(c as Challenge[]) ?? []} />;
}
