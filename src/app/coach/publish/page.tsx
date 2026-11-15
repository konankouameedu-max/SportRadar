import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { ActivityForm } from "@/components/ActivityForm";

export const metadata = { title: "Publier une activité" };

export default async function Page() {
  const profile = await requireProfile("/coach/publish", ["coach"]);
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Publier une activité</h1>
          <p className="mt-1 text-neutral-600">Renseignez les informations principales, puis ajoutez vos créneaux.</p>
        </div>
        <Link href="/coach" className="btn-outline btn-sm">Retour</Link>
      </div>
      <ActivityForm mode={{ kind: "create", coachId: profile.id }} />
    </div>
  );
}
