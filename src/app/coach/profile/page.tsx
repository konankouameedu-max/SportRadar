import { requireProfile } from "@/lib/auth";
import { ProfileEditor } from "@/components/ProfileEditor";

export const metadata = { title: "Mon profil" };

export default async function Page() {
  return <ProfileEditor profile={await requireProfile("/coach/profile", ["coach"])} />;
}
