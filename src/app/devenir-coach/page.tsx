import Link from "next/link";
import type { Metadata } from "next";
import { BarChart3, CalendarClock, ClipboardList, Eye, MapPin, MousePointerClick, PenSquare, ShieldCheck, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Devenir coach ou association partenaire",
  description: "Coach sportif ou association : publiez vos séances, définissez vos créneaux et recevez des réservations sur SportRadar.",
};

const why = [
  { icon: Eye, title: "Visibilité locale", text: "Soyez trouvé par des utilisateurs proches de votre zone et augmentez vos inscriptions." },
  { icon: MousePointerClick, title: "Réservations simplifiées", text: "Proposez des créneaux (date/heure) et laissez les sportifs réserver en quelques clics." },
  { icon: TrendingUp, title: "Développez votre activité", text: "Attirez de nouveaux clients/adhérents sans investir dans un site ou une pub coûteuse." },
];
const features = [
  { icon: PenSquare, title: "Publier une activité", text: "Ajoutez un titre, une description, un niveau, une catégorie et les infos importantes." },
  { icon: CalendarClock, title: "Définir des créneaux", text: "Ajoutez une date, une heure et un nombre de places pour chaque séance." },
  { icon: MapPin, title: "Localisation", text: "Indiquez un lieu précis pour être proposé aux utilisateurs autour de vous." },
  { icon: ClipboardList, title: "Suivi des réservations", text: "Visualisez les participants, les places restantes et les inscriptions confirmées." },
  { icon: BarChart3, title: "Croissance", text: "Construisez une communauté locale et augmentez votre taux de remplissage." },
  { icon: ShieldCheck, title: "Confiance", text: "Un espace sécurisé : connexion, gestion de compte et parcours clair." },
];
const steps = [
  ["Créer un compte", "Inscription coach/association en quelques minutes."],
  ["Publier une activité", "Titre, description, niveau, catégorie."],
  ["Ajouter un créneau", "Date + heure + nombre de places pour permettre la réservation."],
  ["Recevoir des réservations", "Suivi des inscriptions et gestion des participants."],
];
const faq = [
  ["Est-ce réservé aux coachs sportifs ?", "Non, les associations sportives et structures locales peuvent aussi publier des activités."],
  ["Comment les utilisateurs réservent une séance ?", "Ils choisissent une activité puis sélectionnent un créneau (date/heure) et le nombre de participants avant de confirmer."],
  ["Comment éviter le surbooking ?", "Chaque créneau a un nombre de places : la plateforme bloque automatiquement les réservations lorsqu'il est complet."],
  ["Quelles informations sont demandées à l'inscription ?", "Nom, e-mail, téléphone, numéro SIRET ou SIREN et adresse postale. Le SIRET/SIREN est vérifié automatiquement."],
];

export default function BecomeCoachPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-primary-700 to-primary-500 py-16 text-white md:py-24">
        <div className="container-custom max-w-4xl text-center">
          <h1 className="mb-6 text-3xl font-bold md:text-5xl">Coach sportif ou association : proposez vos activités sportives locales sur SportRadar</h1>
          <p className="mb-8 text-lg text-primary-50">
            Rejoignez SportRadar pour gagner en visibilité, publier vos séances (date/heure/lieu) et recevoir des réservations facilement.
            Développez votre activité près de chez vous, sans site complexe.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register?type=coach" className="btn bg-white text-primary-700 hover:bg-primary-50">Je m&apos;inscris (coach / association)</Link>
            <Link href="/discover" className="btn-outline-white">Voir les activités côté utilisateurs</Link>
          </div>
          <p className="mt-6 text-sm">Déjà inscrit ? <Link href="/login" className="font-semibold underline">Se connecter</Link></p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-custom">
          <h2 className="mb-4 text-center text-2xl md:text-3xl">Pourquoi rejoindre SportRadar ?</h2>
          <p className="mx-auto mb-10 max-w-3xl text-center text-neutral-600">
            SportRadar met en relation des particuliers avec des coachs sportifs et associations sportives. Votre objectif : remplir vos séances plus facilement grâce à une présence locale.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {why.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl bg-neutral-50 p-6 shadow-card">
                <Icon className="mb-3 text-primary-600" />
                <h3 className="mb-2 text-lg">{title}</h3>
                <p className="text-sm text-neutral-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          <h2 className="mb-4 text-center text-2xl md:text-3xl">Fonctionnalités pour coachs et associations</h2>
          <p className="mx-auto mb-10 max-w-3xl text-center text-neutral-600">Des fonctionnalités concrètes : publication, créneaux, réservations et suivi.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl bg-white p-6 shadow-card">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600"><Icon size={20} /></div>
                <h3 className="mb-2 text-lg">{title}</h3>
                <p className="text-sm text-neutral-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-custom">
          <h2 className="mb-10 text-center text-2xl md:text-3xl">Comment ça marche ?</h2>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, text], i) => (
              <li key={title} className="rounded-xl border border-neutral-200 p-6">
                <p className="text-sm font-semibold text-primary-600">Étape {i + 1}</p>
                <h3 className="my-2 text-lg">{title}</h3>
                <p className="text-sm text-neutral-600">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register?type=coach" className="btn-primary">Je m&apos;inscris maintenant</Link>
            <Link href="/discover" className="btn-outline">Voir la carte des activités</Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom max-w-3xl">
          <h2 className="mb-8 text-center text-2xl md:text-3xl">FAQ</h2>
          <div className="space-y-3">
            {faq.map(([q, a]) => (
              <details key={q} className="group rounded-xl bg-white p-5 shadow-card">
                <summary className="cursor-pointer list-none font-heading font-semibold marker:hidden">
                  <span className="mr-2 inline-block text-primary-600 transition-transform group-open:rotate-90">›</span>{q}
                </summary>
                <p className="mt-3 text-neutral-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-700 py-16 text-center text-white">
        <div className="container-custom">
          <h2 className="mb-4 text-2xl md:text-3xl">Prêt à proposer vos activités sportives ?</h2>
          <p className="mb-6 text-primary-100">Créez votre compte coach/association et commencez à publier des activités sportives locales.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register?type=coach" className="btn bg-white text-primary-700 hover:bg-primary-50">Créer mon compte coach</Link>
            <Link href="/" className="btn-outline-white">Découvrir SportRadar</Link>
          </div>
        </div>
      </section>
    </>
  );
}
