import { describe, expect, it } from "vitest";
import { isValidEmail, isValidSiretOrSiren, validateRegister, FIELDS_BY_TYPE } from "./validation";

describe("email", () => {
  it("accepte les adresses valides", () => {
    expect(isValidEmail("jean.dupont@exemple.fr")).toBe(true);
    expect(isValidEmail("a+b@sub.domaine.com")).toBe(true);
  });
  it("refuse les adresses invalides", () => {
    for (const e of ["jean", "jean@", "@x.fr", "jean@x", "jean@@x.fr", "jean..d@x.fr", "jean@x.f"]) expect(isValidEmail(e)).toBe(false);
  });
});

describe("SIRET / SIREN", () => {
  it("valide un SIREN et un SIRET corrects", () => {
    expect(isValidSiretOrSiren("732829320")).toBe(true);
    expect(isValidSiretOrSiren("732 829 320 00074")).toBe(true);
    expect(isValidSiretOrSiren("35600000000048")).toBe(true); // La Poste (siège)
    expect(isValidSiretOrSiren("35600000000060")).toBe(true); // La Poste (établissement)
  });
  it("refuse une clé incorrecte ou une mauvaise longueur", () => {
    expect(isValidSiretOrSiren("732829321")).toBe(false);
    expect(isValidSiretOrSiren("73282932000075")).toBe(false);
    expect(isValidSiretOrSiren("12345")).toBe(false);
    expect(isValidSiretOrSiren("ABCDEFGHI")).toBe(false);
  });
});

describe("formulaire d'inscription", () => {
  const base = { firstName: "Jean", lastName: "Dupont", email: "jean@exemple.fr", password: "Motdepasse1", passwordConfirm: "Motdepasse1" };
  it("particulier valide sans champs pro", () => {
    expect(validateRegister({ accountType: "particulier", ...base })).toEqual({});
  });
  it("mots de passe différents", () => {
    const e = validateRegister({ accountType: "particulier", ...base, passwordConfirm: "Autre1234" });
    expect(e.passwordConfirm).toMatch(/ne correspondent pas/);
  });
  it("coach : téléphone, SIRET et adresse obligatoires", () => {
    const e = validateRegister({ accountType: "coach", ...base });
    expect(Object.keys(e).sort()).toEqual(["addressLine", "city", "phone", "postalCode", "siret"]);
  });
  it("entreprise valide", () => {
    expect(validateRegister({ accountType: "entreprise", ...base, companyName: "ACME", siret: "73282932000074", phone: "0612345678", addressLine: "1 rue de Paris", postalCode: "75001", city: "Paris" })).toEqual({});
  });
  it("champs par type", () => {
    expect(FIELDS_BY_TYPE.particulier).not.toContain("siret");
    expect(FIELDS_BY_TYPE.entreprise).toContain("companyName");
  });
});
