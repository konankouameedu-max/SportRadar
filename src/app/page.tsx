import Link from "next/link";
import { Award, Calendar, Heart, Map, MapPin, User } from "lucide-react";

const features = [
  { icon: MapPin, title: "Activités locales", text: "Trouvez des activités sportives à proximité de chez vous, adaptées à vos goûts.", cls: "bg-primary-100 text-primary-600" },
  { icon: Calendar, title: "Planification intelligente", text: "Organisez vos activités selon la météo, la qualité de l'air et vos disponibilités.", cls: "bg-white text-violet-600" },
  { icon: Award, title: "Badge SportZen", text: "Débloquez des badges et suivez votre progression pour rester motivé.", cls: "bg-accent-100 text-accent-600" },
  { icon: Heart, title: "Bien-être global", text: "Améliorez votre santé physique et mentale grâce à des activités adaptées.", cls: "bg-secondary-300 text-white" },
];

const steps = [
  { icon: User, title: "Inscription", text: "Créez votre compte et renseignez vos préférences sportives." },
  { icon: Map, title: "Découverte", text: "Explorez les activités recommandées selon vos critères." },
  { icon: Calendar, title: "Planification", text: "Ajoutez des activités à votre calendrier personnel." },
  { icon: Award, title: "Progression", text: "Suivez vos performances et gagnez des badges." },
];

export default function HomePage() {
  return (
    <>
      <section
        className="relative flex min-h-[520px] items-center bg-neutral-500 bg-cover bg-center md:min-h-[640px]"
        style={{ backgroundImage: "url(/images/hero-image.png)" }}
      >
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div className="container-custom relative py-20 text-white">
          <div className="max-w-2xl">
            <h1 className="mb-6 font-bold">Bougez localement, vivez mieux</h1>
            <p className="mb-8 text-lg md:text-xl">
              Découvrez des activités sportives près de chez vous, adaptées à vos préférences et aux conditions extérieures.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/register" className="btn-primary">Commencer maintenant</Link>
              <Link href="#pourquoi" className="btn-outline-white">En savoir plus</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="pourquoi" className="bg-white py-16 md:py-24">
        <div className="container-custom">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 text-2xl md:text-3xl">Pourquoi SportRadar ?</h2>
            <p className="text-neutral-600">Nous révolutionnons la façon dont vous pratiquez le sport en tenant compte de votre environnement et de vos préférences.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text, cls }) => (
              <div key={title} className="rounded-xl bg-neutral-50 p-6 text-center shadow-card">
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${cls}`}><Icon size={22} /></div>
                <h3 className="mb-2 text-lg md:text-xl">{title}</h3>
                <p className="text-sm text-neutral-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="container-custom">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 text-2xl md:text-3xl">Comment ça marche ?</h2>
            <p className="text-neutral-600">En quelques étapes simples, commencez à profiter d&apos;activités sportives adaptées à vos besoins.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }) => (
              <div key={title} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary-500 text-primary-500"><Icon size={20} /></div>
                <h3 className="mb-2 text-lg">{title}</h3>
                <p className="text-sm text-neutral-600">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/discover" className="btn-primary">Voir les activités</Link>
          </div>
        </div>
      </section>
    </>
  );
}
