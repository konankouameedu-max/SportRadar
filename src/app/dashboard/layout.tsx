import { requireProfile } from "@/lib/auth";
import { UserShell } from "./UserShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireProfile("/dashboard");
  return <UserShell>{children}</UserShell>;
}
