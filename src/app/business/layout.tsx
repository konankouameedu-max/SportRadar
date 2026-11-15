import { requireProfile } from "@/lib/auth";
import { BusinessShell } from "./BusinessShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireProfile("/business", ["entreprise"]);
  return <BusinessShell>{children}</BusinessShell>;
}
