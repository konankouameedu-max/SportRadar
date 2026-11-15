import { requireProfile } from "@/lib/auth";
import { CoachShell } from "./CoachShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireProfile("/coach", ["coach"]);
  return <CoachShell>{children}</CoachShell>;
}
