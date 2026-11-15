const TZ = "Europe/Paris";

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ });
export const fmtShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const fmtDateTime = (iso: string) => `${fmtDate(iso)} à ${fmtTime(iso)}`;

/** Clé AAAA-MM-JJ d'une date ISO dans le fuseau Europe/Paris. */
export const dayKey = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });

/** Convertit une date + heure saisies (heure de Paris) en ISO UTC. */
export function parisLocalToIso(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    .formatToParts(new Date(guess))
    .reduce<Record<string, number>>((acc, p) => (p.type !== "literal" ? { ...acc, [p.type]: Number(p.value) } : acc), {});
  const asParis = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  return new Date(guess - (asParis - guess)).toISOString();
}

export function errorMessage(e: unknown, fallback = "Une erreur est survenue. Veuillez réessayer."): string {
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    const m = (e as { message: string }).message;
    if (/row-level security|permission denied/i.test(m)) return "Action non autorisée pour votre compte.";
    if (/failed to fetch|network/i.test(m)) return "Connexion au serveur impossible. Vérifiez votre connexion internet.";
    return m;
  }
  return fallback;
}
