import { requireProfile } from "@/lib/auth";
import { ProfileEditor } from "@/components/ProfileEditor";

export const metadata = { title: "Profil entreprise" };

export default async function Page() {
  return <ProfileEditor profile={await requireProfile("/business/profile", ["entreprise"])} />;
}
