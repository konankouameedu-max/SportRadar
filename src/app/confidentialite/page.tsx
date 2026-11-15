import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="15 novembre 2026">
      <p>SportRadar s&apos;engage à protéger vos données personnelles conformément au Règlement général sur la protection des données (RGPD).</p>
      <h2>Données collectées</h2>
      <ul>
        <li>Compte particulier : nom, prénom, adresse e-mail.</li>
        <li>Compte coach : nom, prénom, e-mail, téléphone, numéro SIRET/SIREN, adresse postale.</li>
        <li>Compte entreprise : nom de l&apos;entreprise, SIRET/SIREN, adresse, nom du représentant, e-mail professionnel, téléphone.</li>
        <li>Réservations : activité, créneau, nombre de participants, date d&apos;acceptation des CGV.</li>
      </ul>
      <h2>Finalités</h2>
      <p>Les données sont utilisées uniquement pour le fonctionnement de la plateforme : création de compte, réservation d&apos;activités, mise en relation avec les coachs et statistiques internes. Elles ne sont jamais revendues.</p>
      <h2>Sécurité</h2>
      <ul>
        <li>Les mots de passe sont chiffrés (hachage bcrypt) et ne sont jamais stockés en clair.</li>
        <li>Les échanges sont chiffrés (HTTPS).</li>
        <li>Chaque utilisateur n&apos;accède qu&apos;à ses propres données grâce à des règles de sécurité appliquées directement dans la base de données.</li>
        <li>Aucune donnée bancaire n&apos;est collectée.</li>
      </ul>
      <h2>Destinataires</h2>
      <p>Le coach d&apos;une activité voit le nom, l&apos;e-mail et le nombre de participants des personnes ayant réservé ses séances. Les hébergeurs (Vercel, Supabase) agissent en tant que sous-traitants.</p>
      <h2>Durée de conservation</h2>
      <p>Les données sont conservées pendant la durée d&apos;utilisation du compte puis supprimées dans un délai de 3 ans après la dernière activité.</p>
      <h2>Vos droits</h2>
      <p>Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;opposition, de portabilité et de suppression de vos données. Pour les exercer : contact@sportradar.com. Vous pouvez également saisir la CNIL (cnil.fr).</p>
    </LegalPage>
  );
}
