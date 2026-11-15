export type Consent = "accepted" | "refused" | null;
const KEY = "sportradar-cookie-consent";
export const CONSENT_EVENT = "sportradar-consent-change";

export function readConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY);
    return v === "accepted" || v === "refused" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(v: Consent) {
  try {
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible : le choix vaut pour la session */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
