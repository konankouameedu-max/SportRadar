"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, Building2, Hash, Mail, MapPin, Phone, User, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { dashboardPathFor, type Profile } from "@/lib/types";
import { FIELDS_BY_TYPE, validateRegister, type AccountType, type FieldErrors, type RegisterInput } from "@/lib/validation";
import { PasswordInput } from "@/components/PasswordInput";
import { useAuth } from "@/components/AuthProvider";

const TYPES: { value: AccountType; label: string; icon: typeof User; help: string }[] = [
  { value: "particulier", label: "Particulier", icon: User, help: "Pour réserver des activités sportives près de chez vous." },
  { value: "coach", label: "Coach", icon: Users, help: "Coach sportif ou association : publiez vos activités et recevez des réservations." },
  { value: "entreprise", label: "Entreprise", icon: Building2, help: "Proposez des activités et des défis bien-être à vos salariés." },
];

type FieldDef = { label: (t: AccountType) => string; type?: string; placeholder: string; icon?: typeof User; autoComplete?: string; inputMode?: "numeric" | "tel" | "email" };

const DEFS: Record<Exclude<keyof RegisterInput, "accountType" | "password" | "passwordConfirm">, FieldDef> = {
  companyName: { label: () => "Nom de l'entreprise", placeholder: "Ex : ACME SAS", icon: Building2, autoComplete: "organization" },
  firstName: { label: (t) => (t === "entreprise" ? "Prénom du représentant" : "Prénom"), placeholder: "Jean", icon: User, autoComplete: "given-name" },
  lastName: { label: (t) => (t === "entreprise" ? "Nom du représentant" : "Nom"), placeholder: "Dupont", icon: User, autoComplete: "family-name" },
  email: { label: (t) => (t === "entreprise" ? "Adresse e-mail professionnelle" : "Adresse e-mail"), type: "email", placeholder: "votre@email.com", icon: Mail, autoComplete: "email", inputMode: "email" },
  phone: { label: () => "Numéro de téléphone", type: "tel", placeholder: "06 12 34 56 78", icon: Phone, autoComplete: "tel", inputMode: "tel" },
  siret: { label: () => "Numéro SIRET ou SIREN", placeholder: "14 chiffres (SIRET) ou 9 chiffres (SIREN)", icon: Hash, inputMode: "numeric" },
  addressLine: { label: () => "Adresse (numéro et rue)", placeholder: "10 rue de Rivoli", icon: MapPin, autoComplete: "street-address" },
  postalCode: { label: () => "Code postal", placeholder: "75001", inputMode: "numeric", autoComplete: "postal-code" },
  city: { label: () => "Ville", placeholder: "Paris", autoComplete: "address-level2" },
};

const empty: RegisterInput = { accountType: "particulier", firstName: "", lastName: "", email: "", password: "", passwordConfirm: "", phone: "", siret: "", companyName: "", addressLine: "", postalCode: "", city: "" };

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const initialType = (["particulier", "coach", "entreprise"] as const).find((t) => t === params.get("type")) ?? "particulier";
  const [form, setForm] = useState<RegisterInput>({ ...empty, accountType: initialType });
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterInput, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [privacy, setPrivacy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fields = FIELDS_BY_TYPE[form.accountType];
  const errors = useMemo(() => ({ ...validateRegister(form), ...serverErrors }), [form, serverErrors]);
  const show = (f: keyof RegisterInput) => (submitted || touched[f]) && errors[f];

  const set = (f: keyof RegisterInput, v: string) => {
    setForm((s) => ({ ...s, [f]: v }));
    setServerErrors((e) => {
      const next = { ...e };
      delete next[f];
      return next;
    });
  };

  const switchType = (t: AccountType) => {
    setForm((s) => ({ ...s, accountType: t }));
    setTouched({});
    setSubmitted(false);
    setServerErrors({});
    setGlobalError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setGlobalError(null);
    const errs = validateRegister(form);
    if (Object.keys(errs).length || !privacy) {
      setGlobalError("Merci de corriger les champs signalés en rouge.");
      const first = fields.find((f) => errs[f]);
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setLoading(true);
    // N'envoie que les champs du type de compte sélectionné
    const payload = Object.fromEntries([["accountType", form.accountType], ...fields.map((f) => [f, form[f]])]);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerErrors(body.fieldErrors ?? {});
        setGlobalError(body.error ?? "Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email: form.email.trim().toLowerCase(), password: form.password });
      if (error || !data.user) {
        router.push("/login?inscrit=1");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single<Profile>();
      await refresh();
      router.replace(`${dashboardPathFor(profile)}?bienvenue=1`);
      router.refresh();
    } catch {
      setGlobalError("Connexion au serveur impossible. Vérifiez votre connexion internet et réessayez.");
      setLoading(false);
    }
  };

  const renderField = (f: keyof typeof DEFS) => {
    const d = DEFS[f];
    const Icon = d.icon;
    const err = show(f);
    return (
      <div key={f} className={f === "postalCode" || f === "city" ? "" : "sm:col-span-2"}>
        <label htmlFor={f} className="label">{d.label(form.accountType)} <span className="text-red-500" aria-hidden>*</span></label>
        <div className="relative">
          {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" aria-hidden />}
          <input
            id={f} name={f} type={d.type ?? "text"} value={String(form[f] ?? "")} placeholder={d.placeholder}
            autoComplete={d.autoComplete} inputMode={d.inputMode}
            onChange={(e) => set(f, e.target.value)} onBlur={() => setTouched((t) => ({ ...t, [f]: true }))}
            className={`input ${Icon ? "pl-10" : ""} ${err ? "input-error" : ""}`} aria-invalid={!!err} aria-describedby={err ? `${f}-err` : undefined}
          />
        </div>
        {err && <p id={`${f}-err`} className="field-error">{err}</p>}
      </div>
    );
  };

  const active = TYPES.find((t) => t.value === form.accountType)!;

  return (
    <div className="flex justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-card sm:p-8">
        <div className="mb-8 text-center">
          <Activity className="mx-auto mb-4 h-10 w-10 text-primary-500" aria-hidden />
          <h1 className="text-3xl font-bold">Inscription</h1>
          <p className="mt-2 text-neutral-600">Créez votre compte SportRadar</p>
        </div>

        <form onSubmit={submit} noValidate>
          <fieldset className="mb-6">
            <legend className="label">Type de compte</legend>
            <div className="grid grid-cols-3 gap-2" role="radiogroup">
              {TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value} type="button" role="radio" aria-checked={form.accountType === value} onClick={() => switchType(value)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-sm transition-colors ${
                    form.accountType === value ? "border-primary-500 bg-primary-50 font-medium text-primary-700" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <Icon size={16} aria-hidden /> {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral-500">{active.help}</p>
          </fieldset>

          {globalError && <div className="alert-error mb-4" role="alert">{globalError}</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.filter((f): f is keyof typeof DEFS => f in DEFS).map(renderField)}

            <div className="sm:col-span-2">
              <label htmlFor="password" className="label">Mot de passe <span className="text-red-500" aria-hidden>*</span></label>
              <PasswordInput id="password" name="password" autoComplete="new-password" value={form.password} placeholder="••••••••"
                onChange={(e) => set("password", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                invalid={!!show("password")} aria-describedby="password-help" />
              {show("password") ? <p className="field-error">{errors.password}</p> :
                <p id="password-help" className="mt-1 text-xs text-neutral-500">8 caractères minimum, avec une majuscule, une minuscule et un chiffre.</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="passwordConfirm" className="label">Confirmation du mot de passe <span className="text-red-500" aria-hidden>*</span></label>
              <PasswordInput id="passwordConfirm" name="passwordConfirm" autoComplete="new-password" value={form.passwordConfirm} placeholder="••••••••"
                onChange={(e) => set("passwordConfirm", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, passwordConfirm: true }))}
                invalid={!!show("passwordConfirm")} />
              {show("passwordConfirm") ? <p className="field-error">{errors.passwordConfirm}</p> :
                form.passwordConfirm && form.password === form.passwordConfirm && <p className="mt-1 text-sm text-green-700">✓ Les mots de passe correspondent.</p>}
            </div>
          </div>

          <label className="mt-5 flex items-start gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-neutral-300" aria-invalid={submitted && !privacy} />
            <span>J&apos;accepte que mes données soient traitées conformément à la <Link href="/confidentialite" className="text-primary-700 underline" target="_blank">politique de confidentialité</Link>. <span className="text-red-500">*</span></span>
          </label>
          {submitted && !privacy && <p className="field-error">Vous devez accepter la politique de confidentialité pour créer un compte.</p>}

          <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>{loading ? "Création du compte..." : "Créer mon compte"}</button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          Déjà inscrit ? <Link href="/login" className="font-medium text-primary-700 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
