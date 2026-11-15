import Link from "next/link";
import type { Metadata } from "next";
import { BarChart3, Settings, Trophy, Users } from "lucide-react";

export const metadata: Metadata = { title: "SportRadar pour les entreprises" };

const items = [
  { icon: Users, title: "Engagement des employés", text: "Motivez vos équipes avec des activités sportives adaptées et des défis d'entreprise personnalisés." },
  { icon: Trophy, title: "Défis d'entreprise", text: "Créez des challenges stimulants pour renforcer l'esprit d'équipe et promouvoir un mode de vie actif." },
  { icon: BarChart3, title: "Analyses détaillées", text: "Suivez la participation et mesurez l'impact de vos initiatives bien-être avec des rapports détaillés." },
  { icon: Settings, title: "Solution personnalisée", text: "Adaptez la plateforme à votre image de marque et aux besoins spécifiques de votre entreprise." },
];

export default function BusinessInfoPage() {
  return (
    <div className="py-16 md:py-20">
      <div className="container-custom">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h1 className="mb-4 text-3xl md:text-4xl">SportRadar pour les entreprises</h1>
          <p className="text-lg text-neutral-600">Améliorez le bien-être de vos employés avec notre solution complète</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {items.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl bg-white p-6 shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600"><Icon size={22} /></div>
              <h2 className="mb-2 text-xl md:text-2xl">{title}</h2>
              <p className="text-neutral-600">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl bg-primary-700 p-8 text-center text-white md:p-12">
          <h2 className="mb-4 text-2xl md:text-3xl">Prêt à transformer le bien-être de vos employés ?</h2>
          <p className="mb-6 text-primary-100">Contactez-nous pour découvrir comment SportRadar peut s&apos;adapter à votre entreprise.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/contact?sujet=demo" className="btn bg-white text-primary-700 hover:bg-primary-50">Demander une démo</Link>
            <Link href="/register?type=entreprise" className="btn-outline-white">Créer un compte entreprise</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
