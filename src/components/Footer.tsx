import Link from "next/link";
import { Facebook, Instagram, Mail, Twitter } from "lucide-react";
import { Logo } from "./Logo";

const quick = [
  ["/", "Accueil"], ["/discover", "Découvrir"], ["/business-info", "Entreprise"],
  ["/devenir-coach", "Coachs / Associations"], ["/login", "Connexion"], ["/register", "Inscription"],
];
const legal = [
  ["/cgv", "Conditions générales de vente (CGV)"], ["/confidentialite", "Politique de confidentialité"],
  ["/mentions-legales", "Mentions légales"], ["/cookies", "Gestion des cookies"],
];

export function Footer() {
  return (
    <footer className="bg-neutral-800 text-neutral-300">
      <div className="container-custom grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo dark />
          <p className="mt-4 text-sm leading-relaxed">
            Votre coach numérique d&apos;activités sportives locales, basé sur le bien-être, la proximité et la personnalisation.
          </p>
          <div className="mt-4 flex gap-4">
            <a href="https://www.instagram.com" aria-label="Instagram" className="hover:text-white" rel="noopener noreferrer" target="_blank"><Instagram size={18} /></a>
            <a href="https://x.com" aria-label="Twitter / X" className="hover:text-white" rel="noopener noreferrer" target="_blank"><Twitter size={18} /></a>
            <a href="https://www.facebook.com" aria-label="Facebook" className="hover:text-white" rel="noopener noreferrer" target="_blank"><Facebook size={18} /></a>
            <a href="mailto:contact@sportradar.com" aria-label="Envoyer un email" className="hover:text-white"><Mail size={18} /></a>
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">Liens rapides</h3>
          <ul className="space-y-2 text-sm">
            {quick.map(([href, label]) => (
              <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">Informations légales</h3>
          <ul className="space-y-2 text-sm">
            {legal.map(([href, label]) => (
              <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">Contact</h3>
          <p className="text-sm">Une question ? N&apos;hésitez pas à nous contacter !</p>
          <a href="mailto:contact@sportradar.com" className="mt-3 block text-sm text-primary-300 hover:text-primary-200">contact@sportradar.com</a>
          <Link href="/contact" className="btn-primary mt-4">Nous contacter</Link>
        </div>
      </div>
      <div className="container-custom border-t border-neutral-700 py-6 text-center text-sm text-neutral-400">
        © {new Date().getFullYear()} SportRadar. Tous droits réservés.
      </div>
    </footer>
  );
}
