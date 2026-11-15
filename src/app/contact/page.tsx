"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/validation";

function ContactForm() {
  const params = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", subject: params.get("sujet") === "demo" ? "Demande de démo entreprise" : "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Veuillez indiquer votre nom.";
    if (!isValidEmail(form.email)) errs.email = "L'adresse e-mail n'est pas valide.";
    if (form.message.trim().length < 5) errs.message = "Votre message est trop court.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus("sending");
    const { error } = await createClient().from("contact_messages").insert({
      name: form.name.trim(), email: form.email.trim(), subject: form.subject.trim() || "Contact", message: form.message.trim(),
    });
    setStatus(error ? "error" : "sent");
  };

  if (status === "sent")
    return <div className="alert-success">Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.</div>;

  const field = (k: keyof typeof form, label: string, type = "text") => (
    <div>
      <label htmlFor={k} className="label">{label}</label>
      <input id={k} type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={`input ${errors[k] ? "input-error" : ""}`} aria-invalid={!!errors[k]} />
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {status === "error" && <div className="alert-error">L&apos;envoi a échoué. Veuillez réessayer ou écrire à contact@sportradar.com.</div>}
      {field("name", "Nom")}
      {field("email", "Email", "email")}
      {field("subject", "Sujet")}
      <div>
        <label htmlFor="message" className="label">Message</label>
        <textarea id="message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`input ${errors.message ? "input-error" : ""}`} aria-invalid={!!errors.message} />
        {errors.message && <p className="field-error">{errors.message}</p>}
      </div>
      <button className="btn-primary w-full" disabled={status === "sending"}>{status === "sending" ? "Envoi..." : "Envoyer"}</button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="container-custom max-w-2xl py-12 md:py-16">
      <div className="rounded-xl bg-white p-6 shadow-card md:p-10">
        <h1 className="mb-2 text-3xl">Nous contacter</h1>
        <p className="mb-6 text-neutral-600">Une question ? Écrivez-nous, ou par e-mail à <a href="mailto:contact@sportradar.com" className="text-primary-700 underline">contact@sportradar.com</a>.</p>
        <Suspense><ContactForm /></Suspense>
      </div>
    </div>
  );
}
