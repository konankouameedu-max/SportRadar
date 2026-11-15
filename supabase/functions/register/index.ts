// Fonction Edge "register" : inscription sécurisée avec validation côté serveur.
// - Ré-applique toutes les règles du formulaire (e-mail, SIRET/SIREN, téléphone, mots de passe…)
// - Crée le compte via l'API admin (clé service_role, jamais exposée au navigateur)
// - Le profil est créé par le trigger SQL `handle_new_user` à partir des métadonnées.
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { normalizeDigits, validateRegister, type RegisterInput } from "../_shared/validation.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  let input: RegisterInput;
  try {
    input = await req.json();
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }

  const errors = validateRegister(input);
  if (Object.keys(errors).length > 0) {
    return json({ error: "Certains champs sont invalides.", fieldErrors: errors }, 422);
  }

  const isPro = input.accountType !== "particulier";
  const metadata = {
    account_type: input.accountType,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    phone: isPro ? normalizeDigits(input.phone ?? "") : null,
    siret: isPro ? normalizeDigits(input.siret ?? "") : null,
    company_name: input.accountType === "entreprise" ? input.companyName?.trim() : null,
    address_line: isPro ? input.addressLine?.trim() : null,
    postal_code: isPro ? input.postalCode?.trim() : null,
    city: isPro ? input.city?.trim() : null,
  };

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("exists") || (error as { code?: string }).code === "email_exists") {
      return json({ error: "Un compte existe déjà avec cette adresse e-mail.", fieldErrors: { email: "Un compte existe déjà avec cette adresse e-mail." } }, 409);
    }
    if (msg.includes("password")) {
      return json({ error: "Mot de passe refusé : choisissez un mot de passe plus robuste.", fieldErrors: { password: "Mot de passe trop faible." } }, 422);
    }
    console.error("register error", error);
    return json({ error: "Impossible de créer le compte pour le moment. Veuillez réessayer." }, 500);
  }

  return json({ ok: true, userId: data.user?.id }, 201);
});
