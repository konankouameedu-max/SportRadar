// Tests PWA : node tests/pwa.mjs [baseUrl]
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const BASE = process.argv[2] || "http://localhost:3000";
const res = [];
const check = (n, c, x = "") => { res.push(c); console.log(c ? "✅" : "❌", n, c ? "" : x); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["Pixel 7"] });
const page = await ctx.newPage();
await page.goto(BASE + "/", { waitUntil: "networkidle" });

const manifestHref = await page.getAttribute('link[rel="manifest"]', "href");
check("Lien vers le manifeste présent", !!manifestHref);
const m = await page.evaluate(async (u) => (await fetch(u)).json(), manifestHref);
check("Manifeste : nom, start_url, display standalone", m.short_name === "SportRadar" && m.start_url && m.display === "standalone");
check("Manifeste : icônes 192, 512 et maskable", ["192x192", "512x512"].every((s) => m.icons.some((i) => i.sizes === s)) && m.icons.some((i) => i.purpose === "maskable"));
for (const i of m.icons) {
  const r = await page.evaluate(async (u) => { const x = await fetch(u); return { ok: x.ok, type: x.headers.get("content-type") || "" }; }, i.src);
  check(`Icône ${i.src} accessible`, r.ok && r.type.includes("png"));
}
check("Icône iPhone (apple-touch-icon)", (await page.locator('link[rel="apple-touch-icon"]').count()) > 0);
check("Méta theme-color", (await page.getAttribute('meta[name="theme-color"]', "content")) === "#0369a1");

// Service worker actif et contrôlant la page
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload({ waitUntil: "networkidle" });
check("Service worker enregistré et actif", await page.evaluate(() => !!navigator.serviceWorker.controller));

// Critères d'installabilité de Chrome
const cdp = await ctx.newCDPSession(page);
const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
check("Chrome : application installable (aucune erreur d'installabilité)", installabilityErrors.length === 0, JSON.stringify(installabilityErrors));

// Hors ligne : page de secours
await ctx.setOffline(true);
await page.goto(BASE + "/discover").catch(() => {});
const offlineShown = await page.getByRole("heading", { name: "Vous êtes hors ligne" }).waitFor({ timeout: 10000 }).then(() => true, () => false);
check("Hors ligne : la page « Vous êtes hors ligne » s'affiche", offlineShown, (await page.evaluate(() => document.body.innerText).catch(() => "")).slice(0, 400).replace(/\n/g, " | "));
await ctx.setOffline(false);

// Page d'installation
await page.goto(BASE + "/application");
check("Page /application (guide d'installation)", await page.getByText("L'application SportRadar").isVisible());
await page.screenshot({ path: process.env.E2E_SHOTS ? `${process.env.E2E_SHOTS}/pwa-application.png` : "test-results/pwa-application.png", fullPage: true });

await browser.close();
const failed = res.filter((r) => !r).length;
console.log(`\n${res.length - failed}/${res.length} contrôles PWA réussis`);
process.exit(failed ? 1 : 0);
