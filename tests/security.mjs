// Tests de sécurité de l'API Supabase (RLS, fonctions RPC, capacité) :
//   node --env-file=.env.local tests/security.mjs
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL, KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const results = [];
const check = (name, cond, extra = "") => { results.push(cond); console.log(cond ? "✅" : "❌", name, cond ? "" : extra); };
const client = () => createClient(URL, KEY, { auth: { persistSession: false } });
async function as(email, password) { const c = client(); const { error } = await c.auth.signInWithPassword({ email, password }); if (error) throw error; return c; }

const anon = client();
const user = await as("particulier.demo@sportradar-demo.fr", "Demo2026!");
const coach = await as("coach.test@sportradar-demo.fr", "Coach2026!");
const coach2 = await as("coach2.demo@sportradar-demo.fr", "Demo2026!");
const biz = await as("entreprise.demo@sportradar-demo.fr", "Demo2026!");
const uid = (await user.auth.getUser()).data.user.id;

// Lecture
check("Visiteur : lit les activités publiées", ((await anon.from("activities").select("id")).data ?? []).length > 0);
check("Visiteur : ne lit aucun profil", ((await anon.from("profiles").select("*")).data ?? []).length === 0);
check("Visiteur : ne lit aucune réservation", ((await anon.from("bookings").select("*")).data ?? []).length === 0);
check("Utilisateur : ne voit que son propre profil", ((await user.from("profiles").select("id")).data ?? []).every((p) => p.id === uid));
check("Fonctions internes non exposées (is_admin)", !!(await user.rpc("is_admin")).error);

// Écriture interdite
const { data: act } = await anon.from("activities").select("id, coach_id").limit(1).single();
check("Particulier : ne peut pas créer d'activité", !!(await user.from("activities").insert({ coach_id: uid, title: "Pirate", description: "Tentative non autorisée", city: "Paris", duration_min: 30 })).error);
const { data: upd } = await coach2.from("activities").update({ title: "Piraté" }).eq("id", act.id).select();
check("Coach : ne peut pas modifier l'activité d'un autre coach", act.coach_id === (await coach2.auth.getUser()).data.user.id || (upd ?? []).length === 0);
await user.from("profiles").update({ role: "admin", account_type: "coach" }).eq("id", uid);
const { data: me } = await user.from("profiles").select("role, account_type").eq("id", uid).single();
check("Utilisateur : ne peut pas s'attribuer le rôle admin ni changer de type", me.role === "user" && me.account_type === "particulier", JSON.stringify(me));
const { data: slot } = await anon.rpc("slot_availability").limit(1).single();
check("Réservation directe dans la table interdite", !!(await user.from("bookings").insert({ slot_id: slot.slot_id, user_id: uid, participants: 1, cgv_accepted_at: new Date().toISOString() })).error);
check("Visiteur : ne peut pas réserver", !!(await anon.rpc("book_slot", { p_slot: slot.slot_id, p_participants: 1, p_accept_cgv: true })).error);
const noCgv = await user.rpc("book_slot", { p_slot: slot.slot_id, p_participants: 1, p_accept_cgv: false });
check("Réservation refusée sans acceptation des CGV", !!noCgv.error && /CGV/.test(noCgv.error.message));
check("Particulier : ne peut pas ajouter d'employé", !!(await user.from("employees").insert({ first_name: "A", last_name: "B", email: "a@b.fr" })).error);
const bizId = (await biz.auth.getUser()).data.user.id;
await biz.from("employees").upsert({ first_name: "Test", last_name: "RLS", email: "rls@test.fr" }, { onConflict: "business_id,email" });
check("Entreprise : ses employés sont invisibles pour les autres comptes", ((await coach.from("employees").select("id")).data ?? []).length === 0 && ((await biz.from("employees").select("business_id")).data ?? []).every((e) => e.business_id === bizId));
check("SIRET invalide refusé par la base", !!(await coach.from("profiles").update({ siret: "12345678901234" }).eq("id", (await coach.auth.getUser()).data.user.id)).error);

// Capacité : créneau de 3 places, 4 réservations simultanées de 1 place
const coachId = (await coach.auth.getUser()).data.user.id;
const { data: a } = await coach.from("activities").insert({ coach_id: coachId, title: "Test capacité", description: "Activité de test de capacité.", city: "Paris", duration_min: 30, status: "published" }).select().single();
const { data: s } = await coach.from("activity_slots").insert({ activity_id: a.id, starts_at: new Date(Date.now() + 864e5).toISOString(), capacity: 3 }).select().single();
const racers = [user, biz, coach2, await as("admin.demo@sportradar-demo.fr", "Admin2026!")];
const res = await Promise.all(racers.map((c) => c.rpc("book_slot", { p_slot: s.id, p_participants: 1, p_accept_cgv: true })));
const okCount = res.filter((r) => !r.error).length;
check("Pas de surréservation en cas de réservations simultanées (3 places, 4 demandes)", okCount === 3, `${okCount} acceptées`);
const { data: av } = await anon.rpc("slot_availability", { p_activity: a.id });
check("Places restantes à 0 après remplissage", av?.[0]?.remaining === 0);
const dup = await user.rpc("book_slot", { p_slot: s.id, p_participants: 1, p_accept_cgv: true });
check("Double réservation du même créneau refusée", !!dup.error);
check("Coach : ne peut pas réserver sa propre activité", !!(await coach.rpc("book_slot", { p_slot: s.id, p_participants: 1, p_accept_cgv: true })).error);
await coach.from("activities").delete().eq("id", a.id);

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} contrôles de sécurité réussis`);
process.exit(failed ? 1 : 0);
