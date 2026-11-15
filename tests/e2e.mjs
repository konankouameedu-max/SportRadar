// Tests de bout en bout (Playwright) : node tests/e2e.mjs [baseUrl]
// Prérequis : application lancée, comptes de démonstration présents (voir README).
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] || process.env.E2E_BASE_URL || "http://localhost:3000";
const SHOTS = process.env.E2E_SHOTS || "test-results";
mkdirSync(SHOTS, { recursive: true });
const stamp = Date.now();
const results = [];
const ok = (name) => { results.push([true, name]); console.log("✅", name); };
const fail = (name, e) => { results.push([false, name]); console.log("❌", name, "\n   ", e?.message?.split("\n")[0] ?? e); };
let failN = 0;
async function step(name, fn) {
  try { await fn(); ok(name); }
  catch (e) {
    fail(name, e);
    // Capture de toutes les pages encore ouvertes pour faciliter le diagnostic
    for (const ctx of browser.contexts()) for (const pg of ctx.pages()) await pg.screenshot({ path: `${SHOTS}/echec-${++failN}.png` }).catch(() => {});
    for (const ctx of browser.contexts()) await ctx.close().catch(() => {});
  }
}
function expect(cond, msg) { if (!cond) throw new Error(msg); }

const browser = await chromium.launch();
const newPage = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR", timezoneId: "Europe/Paris", ...opts });
  await ctx.addInitScript(() => localStorage.setItem("sportradar-cookie-consent", "refused"));
  return ctx.newPage();
};
async function login(page, email, password, business = false) {
  await page.goto(`${BASE}/login`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  if (business) await page.check("input[name=business-login]");
  await page.click("button[type=submit]");
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });
}

async function searchActivity(page, text) {
  await page.goto(`${BASE}/discover`);
  await page.waitForLoadState("networkidle").catch(() => {});
  // Réessaie la saisie jusqu'à ce que React soit hydraté et que le filtre s'applique
  for (let i = 0; i < 20; i++) {
    await page.fill("input[aria-label=Rechercher]", text);
    if ((await page.locator("article").count()) === 1) return;
    await page.waitForTimeout(500);
  }
  throw new Error(`filtre de recherche : ${await page.locator("article").count()} activités affichées pour « ${text} »`);
}

// ---------- 1. Pages publiques ----------
await step("Pages publiques accessibles (accueil, découvrir, CGV, légal, cookies, contact, 404)", async () => {
  const p = await newPage();
  for (const [path, text] of [["/", "Bougez localement"], ["/discover", "Activités disponibles"], ["/business-info", "SportRadar pour les entreprises"], ["/devenir-coach", "Coach sportif ou association"], ["/cgv", "Conditions générales de vente"], ["/mentions-legales", "Mentions légales"], ["/confidentialite", "Politique de confidentialité"], ["/cookies", "Gestion des cookies"], ["/contact", "Nous contacter"], ["/page-inexistante", "Page introuvable"]]) {
    await p.goto(BASE + path);
    expect(await p.getByText(text).first().isVisible(), `${path} : texte « ${text} » absent`);
  }
  await p.goto(BASE + "/");
  expect(await p.locator("footer a[href='/cgv']").count() === 1, "Lien CGV absent du pied de page");
  await p.context().close();
});

// ---------- 2. Formulaire d'inscription dynamique ----------
await step("Inscription : champs adaptés au type de compte", async () => {
  const p = await newPage();
  await p.goto(`${BASE}/register`);
  const ids = async () => p.$$eval("form input[id]", (els) => els.map((e) => e.id).sort());
  const part = await ids();
  expect(JSON.stringify(part) === JSON.stringify(["email", "firstName", "lastName", "password", "passwordConfirm"].sort()), "particulier : " + part);
  await p.getByRole("radio", { name: "Coach" }).click();
  const coach = await ids();
  for (const f of ["phone", "siret", "addressLine", "postalCode", "city"]) expect(coach.includes(f), `coach : champ ${f} manquant`);
  expect(!coach.includes("companyName"), "coach : companyName ne doit pas apparaître");
  await p.getByRole("radio", { name: "Entreprise" }).click();
  const ent = await ids();
  for (const f of ["companyName", "siret", "addressLine", "postalCode", "city", "firstName", "lastName", "email", "phone"]) expect(ent.includes(f), `entreprise : ${f} manquant`);
  expect(await p.getByText("Nom de l'entreprise").isVisible(), "label entreprise");
  expect(await p.getByText("Adresse e-mail professionnelle").isVisible(), "label e-mail pro");
  await p.context().close();
});

await step("Inscription : messages d'erreur (e-mail, SIRET, mots de passe)", async () => {
  const p = await newPage();
  await p.goto(`${BASE}/register?type=coach`);
  await p.fill("#firstName", "Jean"); await p.fill("#lastName", "Test");
  await p.fill("#email", "jean@invalide"); await p.fill("#phone", "123");
  await p.fill("#siret", "12345678901234"); await p.fill("#addressLine", "1 rue");
  await p.fill("#postalCode", "7500"); await p.fill("#city", "Paris");
  await p.fill("#password", "Motdepasse1"); await p.fill("#passwordConfirm", "Motdepasse2");
  await p.click("button[type=submit]");
  for (const t of ["L'adresse e-mail n'est pas valide", "Numéro de téléphone invalide", "SIRET/SIREN n'est pas valide", "Le code postal doit comporter 5 chiffres", "Les mots de passe ne correspondent pas", "politique de confidentialité pour créer un compte"])
    expect(await p.getByText(t).first().isVisible(), `message manquant : ${t}`);
  await p.fill("#passwordConfirm", "Motdepasse1");
  expect(await p.getByText("Les mots de passe correspondent").isVisible(), "confirmation positive absente");
  await p.screenshot({ path: `${SHOTS}/register-errors.png`, fullPage: true });
  await p.context().close();
});

const userEmail = `e2e.particulier.${stamp}@sportradar-demo.fr`;
const coachEmail = `e2e.coach.${stamp}@sportradar-demo.fr`;
const bizEmail = `e2e.entreprise.${stamp}@sportradar-demo.fr`;
const PW = "E2eTest2026!";

await step("Inscription + connexion : compte particulier", async () => {
  const p = await newPage();
  await p.goto(`${BASE}/register`);
  await p.fill("#firstName", "Emma"); await p.fill("#lastName", "Test");
  await p.fill("#email", userEmail); await p.fill("#password", PW); await p.fill("#passwordConfirm", PW);
  await p.check("text=J'accepte que mes données");
  await p.click("button[type=submit]");
  await p.waitForURL(/\/dashboard/, { timeout: 20000 });
  expect(await p.getByText("Bienvenue, Emma").isVisible(), "tableau de bord particulier");
  await p.context().close();
});

await step("Inscription + connexion : compte coach (SIRET, adresse, téléphone)", async () => {
  const p = await newPage();
  await p.goto(`${BASE}/register?type=coach`);
  await p.fill("#firstName", "Hugo"); await p.fill("#lastName", "Coach");
  await p.fill("#email", coachEmail); await p.fill("#phone", "06 98 76 54 32");
  await p.fill("#siret", "732 829 320 00074"); await p.fill("#addressLine", "8 rue de la Paix");
  await p.fill("#postalCode", "75002"); await p.fill("#city", "Paris");
  await p.fill("#password", PW); await p.fill("#passwordConfirm", PW);
  await p.check("text=J'accepte que mes données");
  await p.click("button[type=submit]");
  await p.waitForURL(/\/coach/, { timeout: 20000 });
  await p.getByRole("heading", { name: "Espace Coach" }).waitFor();
  await p.context().close();
});

await step("Inscription + connexion : compte entreprise", async () => {
  const p = await newPage();
  await p.goto(`${BASE}/register?type=entreprise`);
  await p.fill("#companyName", "E2E Industries"); await p.fill("#siret", "552032534");
  await p.fill("#addressLine", "1 place de la Bourse"); await p.fill("#postalCode", "69002"); await p.fill("#city", "Lyon");
  await p.fill("#firstName", "Nina"); await p.fill("#lastName", "Rep"); await p.fill("#email", bizEmail); await p.fill("#phone", "0478000000");
  await p.fill("#password", PW); await p.fill("#passwordConfirm", PW);
  await p.check("text=J'accepte que mes données");
  await p.click("button[type=submit]");
  await p.waitForURL(/\/business/, { timeout: 20000 });
  expect(await p.getByText("Tableau de bord entreprise").isVisible(), "dashboard entreprise");
  await p.context().close();
});

await step("Connexion : mauvais mot de passe et e-mail déjà utilisé", async () => {
  const p = await newPage();
  await p.goto(`${BASE}/login`);
  await p.fill("#email", userEmail); await p.fill("#password", "Mauvais123");
  await p.click("button[type=submit]");
  await p.getByText("Email ou mot de passe incorrect.").waitFor();
  await p.goto(`${BASE}/register`);
  await p.fill("#firstName", "Emma"); await p.fill("#lastName", "Test");
  await p.fill("#email", userEmail); await p.fill("#password", PW); await p.fill("#passwordConfirm", PW);
  await p.check("text=J'accepte que mes données");
  await p.click("button[type=submit]");
  await p.getByText("Un compte existe déjà avec cette adresse e-mail.").first().waitFor();
  await p.context().close();
});

// ---------- 3. Gestion des activités (coach) ----------
const title = `Séance E2E ${stamp}`;
let activityUrl = "";
await step("Coach : création, publication d'une activité avec créneaux", async () => {
  const p = await newPage();
  await login(p, coachEmail, PW);
  await p.goto(`${BASE}/coach/publish`);
  await p.fill("#title", title);
  await p.fill("#description", "Séance de test automatisé : échauffement, circuit et étirements.");
  await p.selectOption("#category", "Running");
  await p.fill("#address", "Place de la Concorde");
  await p.fill("#max", "2");
  const d = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  await p.fill("input[aria-label='Date du premier créneau']", d);
  await p.fill("input[aria-label='Heure du premier créneau']", "10:00");
  await p.click("button:has-text('Publier')");
  await p.waitForURL(/\/coach\/activities\//, { timeout: 15000 });
  activityUrl = p.url().split("?")[0];
  await p.getByText("Activité publiée !").waitFor();
  // créneaux récurrents
  await p.fill("#sd", new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10));
  await p.fill("#st", "18:30"); await p.fill("#sr", "3");
  await p.click("button:has-text('Ajouter')");
  await p.getByText("3 créneaux ajoutés.").waitFor();
  await p.waitForFunction(() => document.querySelectorAll("table tbody tr").length === 4, null, { timeout: 10000 })
    .catch(async () => { throw new Error(`4 créneaux attendus, ${await p.locator("table tbody tr").count()} trouvés`); });
  await p.context().close();
});

await step("Coach : modification d'une activité", async () => {
  const p = await newPage();
  await login(p, coachEmail, PW);
  await p.goto(activityUrl);
  await p.fill("#title", title + " (modifiée)");
  await p.click("button:has-text('Enregistrer les modifications')");
  await p.getByText("Activité mise à jour.").waitFor();
  await p.context().close();
});

// ---------- 4. Réservation ----------
await step("Découvrir : l'activité publiée est visible", async () => {
  const p = await newPage();
  await p.goto(`${BASE}/discover`);
  await p.getByText(title + " (modifiée)").waitFor();
  await p.fill("input[aria-label=Rechercher]", "E2E " + stamp);
  await p.context().close();
});

await step("Réservation : connexion requise, CGV obligatoires, récapitulatif", async () => {
  const p = await newPage();
  await searchActivity(p, "E2E " + stamp);
  await p.click("article button:has-text('Réserver')");
  await p.getByText("la confirmation nécessite une connexion").waitFor();
  await p.context().close();

  const q = await newPage();
  await login(q, userEmail, PW);
  await searchActivity(q, "E2E " + stamp);
  await q.click("article button:has-text('Réserver')");
  const dlg = q.getByRole("dialog", { name: /Réserver/ });
  await dlg.locator("button[aria-pressed]").first().click();
  await dlg.locator("#participants").fill("2");
  const confirmBtn = dlg.getByRole("button", { name: "Confirmer la réservation" });
  expect(await confirmBtn.isDisabled(), "Le bouton doit être désactivé tant que les CGV ne sont pas acceptées");
  await dlg.locator("input[type=checkbox]").check();
  await confirmBtn.click();
  await q.getByText("Réservation confirmée").waitFor({ timeout: 15000 });
  for (const t of ["Récapitulatif", "Participants", "N° de réservation"]) expect(await q.getByText(t, { exact: false }).first().isVisible(), t);
  await q.screenshot({ path: `${SHOTS}/booking-confirmation.png` });
  await q.goto(`${BASE}/dashboard/reservations`);
  await q.getByText(title + " (modifiée)").waitFor();
  await q.goto(`${BASE}/dashboard/badges`);
  expect(await q.getByText("obtenu le").first().isVisible(), "badge « Premier pas » non attribué");
  await q.context().close();
});

await step("Disponibilités : créneau complet après réservation (2/2), refus d'une 2e réservation", async () => {
  const p = await newPage();
  await login(p, "particulier.demo@sportradar-demo.fr", "Demo2026!");
  await searchActivity(p, "E2E " + stamp);
  await p.click("article button:has-text('Réserver')");
  const dlg = p.getByRole("dialog", { name: /Réserver/ });
  const first = dlg.locator("button[aria-pressed]").first();
  await first.waitFor();
  expect(await first.isDisabled() && (await first.innerText()).includes("Complet"), "le créneau plein devrait être « Complet »");
  await p.context().close();
});

await step("Coach : réservation visible dans « Réservations reçues »", async () => {
  const p = await newPage();
  await login(p, coachEmail, PW);
  await p.goto(`${BASE}/coach/reservations`);
  await p.getByText("Emma Test").waitFor();
  await p.context().close();
});

await step("Annulation d'une réservation par l'utilisateur (places libérées)", async () => {
  const p = await newPage();
  await login(p, userEmail, PW);
  await p.goto(`${BASE}/dashboard/reservations`);
  p.once("dialog", (d) => d.accept());
  await p.click("button:has-text('Annuler')");
  await p.getByText("Réservation annulée.").waitFor();
  await searchActivity(p, "E2E " + stamp);
  await p.click("article button:has-text('Réserver')");
  const t = await p.getByRole("dialog", { name: /Réserver/ }).locator("button[aria-pressed]").first().innerText();
  expect(t.includes("2 places"), "les places auraient dû être libérées : " + t);
  await p.context().close();
});

await step("Planning personnel : ajout et suppression", async () => {
  const p = await newPage();
  await login(p, userEmail, PW);
  await p.goto(`${BASE}/dashboard/planning`);
  await p.click("button:has-text('Nouvelle activité')");
  await p.fill("input[aria-label=\"Nom de l'activité\"]", "Footing perso");
  await p.fill("input[aria-label=Date]", new Date(Date.now() + 864e5).toISOString().slice(0, 10));
  await p.fill("input[aria-label=Heure]", "07:30");
  await p.click("button:has-text('Ajouter')");
  await p.getByText("Footing perso").waitFor();
  await p.click("li:has-text('Footing perso') button:has-text('Supprimer')");
  await p.getByText("Footing perso").waitFor({ state: "detached" });
  await p.context().close();
});

// ---------- 5. Entreprise ----------
await step("Entreprise : employés, défis, rapports", async () => {
  const p = await newPage();
  await login(p, bizEmail, PW, true);
  await p.goto(`${BASE}/business/employees`);
  await p.click("button:has-text('Ajouter un employé')");
  await p.fill("#ef", "Paul"); await p.fill("#el", "Salarié"); await p.fill("#ee", "paul@e2e.fr");
  await p.click("form button:has-text('Ajouter')");
  await p.getByText("paul@e2e.fr").waitFor();
  await p.goto(`${BASE}/business/challenges`);
  await p.click("button:has-text('Créer un défi')");
  await p.fill("input[aria-label='Nom du défi']", "10 000 pas");
  await p.fill("#goal", "100"); await p.fill("#prog", "40");
  await p.click("form button:has-text('Créer')");
  await p.getByText("40%").waitFor();
  await p.goto(`${BASE}/business/reports`);
  await p.getByText("Synthèse de l'entreprise").waitFor();
  await p.context().close();
});

// ---------- 6. Sécurité & accès ----------
await step("Accès : visiteur redirigé vers la connexion, particulier refusé côté coach/entreprise/admin", async () => {
  const p = await newPage();
  await p.goto(`${BASE}/dashboard`);
  expect(p.url().includes("/login?next=%2Fdashboard"), "redirection connexion");
  await login(p, userEmail, PW);
  for (const path of ["/coach", "/business", "/admin"]) {
    await p.goto(BASE + path);
    expect(p.url().includes("/acces-refuse"), `${path} devrait être refusé (url : ${p.url()})`);
  }
  await p.context().close();
});

await step("Connexion entreprise refusée pour un compte non-entreprise", async () => {
  const p = await newPage();
  await p.goto(`${BASE}/login`);
  await p.fill("#email", userEmail); await p.fill("#password", PW);
  await p.check("input[name=business-login]");
  await p.click("button[type=submit]");
  await p.getByText("Ce compte n'est pas un compte entreprise").waitFor();
  await p.context().close();
});

await step("Admin : liste des utilisateurs", async () => {
  const p = await newPage();
  await login(p, "admin.demo@sportradar-demo.fr", "Admin2026!");
  await p.goto(`${BASE}/admin`);
  await p.getByText(userEmail).waitFor();
  await p.context().close();
});

await step("Coach : suppression de l'activité", async () => {
  const p = await newPage();
  await login(p, coachEmail, PW);
  await p.goto(`${BASE}/coach`);
  p.once("dialog", (d) => d.accept());
  await p.click(`div:has(> div > div > h2:has-text("${title}")) button:has-text('Supprimer')`);
  await p.getByText(title).waitFor({ state: "detached" });
  await p.goto(`${BASE}/discover`);
  expect(!(await p.getByText(title).count()), "l'activité supprimée est encore visible");
  await p.context().close();
});

// ---------- 7. Responsive ----------
await step("Responsive : mobile, tablette, ordinateur (pas de défilement horizontal)", async () => {
  for (const [name, opts] of [["mobile", devices["iPhone 13"]], ["tablette", devices["iPad (gen 7)"]], ["desktop", { viewport: { width: 1440, height: 900 } }]]) {
    const p = await newPage(opts);
    for (const path of ["/", "/discover", "/register?type=entreprise", "/cgv"]) {
      await p.goto(BASE + path);
      await p.waitForLoadState("networkidle").catch(() => {});
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow <= 1, `${name} ${path} : débordement horizontal de ${overflow}px`);
      await p.screenshot({ path: `${SHOTS}/${name}${path.replace(/[/?=]/g, "_") || "_home"}.png`, fullPage: true });
    }
    await p.context().close();
  }
});

await browser.close();
const failed = results.filter(([r]) => !r);
console.log(`\n${results.length - failed.length}/${results.length} tests réussis`);
process.exit(failed.length ? 1 : 0);
