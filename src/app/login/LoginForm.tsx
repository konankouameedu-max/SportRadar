"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { dashboardPathFor, type Profile } from "@/lib/types";
import { isValidEmail } from "@/lib/validation";
import { safeNext } from "@/lib/redirect";
import { PasswordInput } from "@/components/PasswordInput";
import { useAuth } from "@/components/AuthProvider";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [business, setBusiness] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const justRegistered = params.get("inscrit") === "1";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) return setError("Veuillez saisir une adresse e-mail valide.");
    if (!password) return setError("Veuillez saisir votre mot de passe.");
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (err || !data.user) {
      setLoading(false);
      if (err?.message.match(/invalid login credentials/i)) return setError("Email ou mot de passe incorrect.");
      if (err?.message.match(/rate|too many/i)) return setError("Trop de tentatives. Patientez quelques minutes avant de réessayer.");
      return setError("Erreur de connexion. Veuillez réessayer.");
    }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single<Profile>();
    if (business && profile?.account_type !== "entreprise" && profile?.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      return setError("Ce compte n'est pas un compte entreprise. Décochez « Connexion entreprise » pour vous connecter.");
    }
    await refresh();
    router.replace(safeNext(params.get("next")) ?? dashboardPathFor(profile));
    router.refresh();
  };

  return (
    <div className="flex justify-center px-4 py-12 md:py-20">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-card">
        <div className="mb-8 text-center">
          <Activity className="mx-auto mb-4 h-10 w-10 text-primary-500" aria-hidden />
          <h1 className="text-3xl font-bold">Connexion</h1>
          <p className="mt-2 text-neutral-600">Accédez à votre espace personnel</p>
        </div>
        {justRegistered && <div className="alert-success mb-4">Votre compte a été créé. Vous pouvez vous connecter.</div>}
        {error && <div className="alert-error mb-4" role="alert">{error}</div>}
        <form onSubmit={submit} noValidate className="space-y-5">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" aria-hidden />
              <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="input pl-10" required />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="label">Mot de passe</label>
            <PasswordInput id="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" name="business-login" checked={business} onChange={(e) => setBusiness(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-primary-600" />
            Connexion entreprise
          </label>
          <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-neutral-600">
          Pas encore de compte ? <Link href="/register" className="font-medium text-primary-700 hover:underline">S&apos;inscrire</Link>
        </p>
      </div>
    </div>
  );
}
