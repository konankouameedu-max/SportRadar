"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/format";

export function PartnerForm() {
  const router = useRouter();
  const [f, setF] = useState({ structure_name: "", structure_type: "Coach indépendant", sports: "", message: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.structure_name.trim().length < 2 || f.sports.trim().length < 2) return setErr("Nom de la structure et sports proposés obligatoires.");
    setBusy(true);
    const { error } = await createClient().from("partner_applications").insert({ ...f, structure_name: f.structure_name.trim(), sports: f.sports.trim(), message: f.message.trim() || null });
    setBusy(false);
    if (error) return setErr(errorMessage(error));
    router.refresh();
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-neutral-700">Présentez votre structure : notre équipe valide votre dossier sous 48 h.</p>
      {err && <div className="alert-error">{err}</div>}
      <div><label className="label" htmlFor="sn">Nom de la structure</label><input id="sn" className="input" value={f.structure_name} onChange={(e) => setF({ ...f, structure_name: e.target.value })} /></div>
      <div><label className="label" htmlFor="st">Type</label><select id="st" className="input" value={f.structure_type} onChange={(e) => setF({ ...f, structure_type: e.target.value })}><option>Coach indépendant</option><option>Association</option></select></div>
      <div><label className="label" htmlFor="sp">Sports proposés</label><input id="sp" className="input" placeholder="Ex : yoga, running" value={f.sports} onChange={(e) => setF({ ...f, sports: e.target.value })} /></div>
      <div><label className="label" htmlFor="sm">Message (facultatif)</label><textarea id="sm" rows={4} className="input" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Envoi..." : "Déposer mon dossier"}</button>
    </form>
  );
}
