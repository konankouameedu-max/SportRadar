import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNotice() {
  return (
    <LegalPage title="Mentions légales">
      <p>Le présent site est un projet étudiant réalisé dans un cadre pédagogique. Il s&apos;agit d&apos;une plateforme destinée à démontrer la capacité à concevoir un site intégrant les éléments légaux attendus.</p>
      <h2>1. Éditeur du site</h2>
      <p>Nom du site : SportRadar<br />Responsable de publication : Projet étudiant (IA School)<br />Contact : contact@sportradar.com<br />Adresse : France (adresse non communiquée — projet pédagogique)</p>
      <h2>2. Hébergement</h2>
      <p>Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com<br />Base de données et authentification : Supabase Inc. (serveurs situés dans l&apos;Union européenne, région Paris) — supabase.com</p>
      <h2>3. Propriété intellectuelle</h2>
      <p>L&apos;ensemble des contenus présents sur le site (textes, maquettes, éléments graphiques, logos, composants) est protégé par le droit d&apos;auteur. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation préalable, est interdite.</p>
      <h2>4. Responsabilité</h2>
      <p>SportRadar met tout en œuvre pour fournir des informations exactes. Toutefois, l&apos;éditeur ne saurait être tenu responsable des erreurs, omissions, interruptions du site ou éventuels dommages liés à l&apos;utilisation du service.</p>
      <h2>5. Données personnelles</h2>
      <p>Les données collectées via les formulaires (inscription, contact, réservation) sont utilisées uniquement pour le fonctionnement de la plateforme (gestion de compte, réservations, échanges).</p>
      <p>Conformément au RGPD, l&apos;utilisateur dispose d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et de suppression de ses données. Pour toute demande : contact@sportradar.com.</p>
      <h2>6. Cookies</h2>
      <p>Le site utilise uniquement des cookies techniques nécessaires à l&apos;authentification. Votre choix concernant les autres cookies est géré sur la page <a className="text-primary-700 underline" href="/cookies">Gestion des cookies</a>.</p>
    </LegalPage>
  );
}
