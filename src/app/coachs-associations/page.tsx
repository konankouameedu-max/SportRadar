import Link from "next/link";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PartnerForm } from "./PartnerForm";

export const metadata = { title: "Coachs & Associations — dossier partenaire" };

export default async function Page() {
  const profile = await getSessionProfile();
  let existing: { status: string; structure_name: string } | null = null;
  if (profile) {
    const { data } = await (await createClient()).from("partner_applications").select("status, structure_name").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    existing = data;
  }
  return (
    <div className="container-custom max-w-2xl py-12 md:py-16">
      <div className="rounded-xl bg-white p-6 shadow-card md:p-10">
        <h1 className="mb-4 text-3xl">Coachs &amp; Associations</h1>
        {!profile ? (
          <>
            <p className="mb-6 text-neutral-700">Vous devez être connecté(e) pour déposer un dossier partenaire.</p>
            <Link href="/login?next=/coachs-associations" className="btn-primary">Aller à la connexion</Link>
          </>
        ) : existing ? (
          <div className="alert-info">Votre dossier « {existing.structure_name} » a bien été reçu. Statut : <strong>{existing.status}</strong>.</div>
        ) : (
          <PartnerForm />
        )}
      </div>
    </div>
  );
}
