/**
 * Règles de validation partagées (formulaires côté client).
 * Les mêmes règles sont ré-appliquées côté serveur (fonction Edge `register`
 * et contraintes PostgreSQL), le client n'est jamais la seule barrière.
 */

export type AccountType = "particulier" | "coach" | "entreprise";

export const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "particulier", label: "Particulier" },
  { value: "coach", label: "Coach" },
  { value: "entreprise", label: "Entreprise" },
];

export type RegisterInput = {
  accountType: AccountType;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone?: string;
  siret?: string;
  companyName?: string;
  addressLine?: string;
  postalCode?: string;
  city?: string;
};

export type FieldErrors = Partial<Record<keyof RegisterInput, string>>;

const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export function isValidEmail(email: string): boolean {
  const e = email.trim();
  return e.length <= 254 && EMAIL_RE.test(e) && !e.includes("..");
}

export function normalizeDigits(v: string): string {
  return v.replace(/[\s.-]/g, "");
}

function luhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** SIREN (9 chiffres) ou SIRET (14 chiffres) avec clé de Luhn (cas particulier La Poste). */
export function isValidSiretOrSiren(raw: string): boolean {
  const v = normalizeDigits(raw);
  if (/^\d{9}$/.test(v)) return luhn(v);
  if (/^\d{14}$/.test(v)) {
    // Établissements de La Poste : somme des chiffres multiple de 5 (le siège reste en Luhn).
    if (v.startsWith("356000000") && v.split("").reduce((s, c) => s + Number(c), 0) % 5 === 0) return true;
    return luhn(v);
  }
  return false;
}

export function isValidFrenchPhone(raw: string): boolean {
  const v = normalizeDigits(raw);
  return /^(?:0[1-9]\d{8}|\+33[1-9]\d{8})$/.test(v);
}

export function isValidPostalCode(v: string): boolean {
  return /^\d{5}$/.test(v.trim());
}

/** Au moins 8 caractères, une majuscule, une minuscule et un chiffre. */
export function passwordIssues(pw: string): string | null {
  if (pw.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (pw.length > 72) return "Le mot de passe ne doit pas dépasser 72 caractères.";
  if (!/[a-z]/.test(pw)) return "Le mot de passe doit contenir au moins une lettre minuscule.";
  if (!/[A-Z]/.test(pw)) return "Le mot de passe doit contenir au moins une lettre majuscule.";
  if (!/\d/.test(pw)) return "Le mot de passe doit contenir au moins un chiffre.";
  return null;
}

/** Champs visibles et obligatoires selon le type de compte. */
export const FIELDS_BY_TYPE: Record<AccountType, (keyof RegisterInput)[]> = {
  particulier: ["firstName", "lastName", "email", "password", "passwordConfirm"],
  coach: ["firstName", "lastName", "email", "phone", "siret", "addressLine", "postalCode", "city", "password", "passwordConfirm"],
  entreprise: ["companyName", "siret", "addressLine", "postalCode", "city", "firstName", "lastName", "email", "phone", "password", "passwordConfirm"],
};

export function validateRegister(input: RegisterInput): FieldErrors {
  const errors: FieldErrors = {};
  const fields = FIELDS_BY_TYPE[input?.accountType];
  if (!fields) return { accountType: "Type de compte invalide." };
  const has = (f: keyof RegisterInput) => fields.includes(f);
  const val = (f: keyof RegisterInput) => String(input[f] ?? "").trim();
  const nameRe = /^[\p{L}][\p{L}' -]{0,79}$/u;
  const rep = input.accountType === "entreprise" ? " du représentant" : "";

  if (!val("firstName")) errors.firstName = `Le prénom${rep} est obligatoire.`;
  else if (!nameRe.test(val("firstName"))) errors.firstName = "Le prénom contient des caractères non autorisés.";
  if (!val("lastName")) errors.lastName = `Le nom${rep} est obligatoire.`;
  else if (!nameRe.test(val("lastName"))) errors.lastName = "Le nom contient des caractères non autorisés.";

  if (!val("email")) errors.email = "L'adresse e-mail est obligatoire.";
  else if (!isValidEmail(val("email")))
    errors.email = "L'adresse e-mail n'est pas valide (exemple : prenom.nom@domaine.fr).";

  if (has("companyName")) {
    if (val("companyName").length < 2) errors.companyName = "Le nom de l'entreprise est obligatoire (2 caractères minimum).";
  }
  if (has("phone")) {
    if (!val("phone")) errors.phone = "Le numéro de téléphone est obligatoire.";
    else if (!isValidFrenchPhone(val("phone")))
      errors.phone = "Numéro de téléphone invalide (format attendu : 06 12 34 56 78 ou +33 6 12 34 56 78).";
  }
  if (has("siret")) {
    const d = normalizeDigits(val("siret"));
    if (!d) errors.siret = "Le numéro SIRET ou SIREN est obligatoire.";
    else if (!/^\d+$/.test(d)) errors.siret = "Le SIRET/SIREN ne doit contenir que des chiffres.";
    else if (d.length !== 9 && d.length !== 14)
      errors.siret = `Le SIREN comporte 9 chiffres et le SIRET 14 chiffres (vous en avez saisi ${d.length}).`;
    else if (!isValidSiretOrSiren(d))
      errors.siret = "Ce numéro SIRET/SIREN n'est pas valide (clé de contrôle incorrecte).";
  }
  if (has("addressLine") && val("addressLine").length < 5) errors.addressLine = "L'adresse (numéro et rue) est obligatoire.";
  if (has("postalCode") && !isValidPostalCode(val("postalCode"))) errors.postalCode = "Le code postal doit comporter 5 chiffres.";
  if (has("city") && val("city").length < 2) errors.city = "La ville est obligatoire.";

  const pwIssue = passwordIssues(String(input.password ?? ""));
  if (pwIssue) errors.password = pwIssue;
  if (!input.passwordConfirm) errors.passwordConfirm = "Veuillez confirmer votre mot de passe.";
  else if (input.password !== input.passwordConfirm) errors.passwordConfirm = "Les mots de passe ne correspondent pas.";

  return errors;
}
