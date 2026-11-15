import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Employee } from "../types";
import { EmployeesClient } from "./EmployeesClient";

export const metadata = { title: "Employés" };

export default async function Page() {
  const profile = await requireProfile("/business/employees", ["entreprise"]);
  const { data } = await (await createClient()).from("employees").select("*").eq("business_id", profile.id).order("last_name");
  return <EmployeesClient initial={(data as Employee[]) ?? []} />;
}
