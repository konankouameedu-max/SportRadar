import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Conditions générales de vente (CGV)" };

export default function CGVPage() {
  return (
    <LegalPage title="Conditions générales de vente (CGV)" updated="15 novembre 2026">
      <p>
        Les présentes conditions générales de vente (ci-après « CGV ») encadrent l&apos;utilisation du module de réservation proposé
        sur la plateforme SportRadar. Le site est un projet étudiant réalisé dans un cadre pédagogique. Aucun paiement en ligne n&apos;est
        proposé : toutes les réservations effectuées via la plateforme sont gratuites et aucune donnée bancaire n&apos;est collectée.
      </p>

      <h2>1. Objet</h2>
      <p>Les CGV définissent les droits et obligations des utilisateurs, des coachs/associations et de SportRadar lors de la réservation d&apos;activités sportives.</p>

      <h2>2. Acceptation des CGV</h2>
      <p>
        Toute réservation nécessite l&apos;acceptation préalable et expresse des présentes CGV, matérialisée par une case à cocher obligatoire
        au moment de la confirmation. La date et l&apos;heure de cette acceptation sont enregistrées avec la réservation.
      </p>

      <h2>3. Rôle de la plateforme</h2>
      <p>
        SportRadar agit comme une plateforme de mise en relation entre utilisateurs et coachs sportifs ou associations. Le coach ou
        l&apos;association qui publie une activité est seul responsable de son contenu, de son organisation et de son déroulement.
      </p>

      <h2>4. Modalités de réservation</h2>
      <ul>
        <li>L&apos;utilisateur doit disposer d&apos;un compte et être connecté.</li>
        <li>Il sélectionne une activité, un créneau (date et heure) et un nombre de participants (1 à 10).</li>
        <li>La réservation n&apos;est confirmée que s&apos;il reste suffisamment de places sur le créneau : le nombre de places est vérifié en temps réel.</li>
        <li>Une confirmation récapitulant l&apos;activité, la date, l&apos;heure, le lieu et le nombre de participants est affichée et reste consultable dans l&apos;espace « Mes réservations ».</li>
      </ul>

      <h2>5. Prix et paiement</h2>
      <p>
        Les activités proposées sur SportRadar sont actuellement gratuites. Si un paiement en ligne devait être mis en place, il serait
        traité exclusivement par un prestataire de paiement sécurisé certifié PCI-DSS ; SportRadar ne stockerait jamais les coordonnées
        bancaires des utilisateurs, et les présentes CGV seraient mises à jour en conséquence.
      </p>

      <h2>6. Annulation et modification</h2>
      <p>
        L&apos;utilisateur peut annuler sa réservation à tout moment avant le début de la séance depuis son espace « Mes réservations ».
        Les places libérées redeviennent immédiatement disponibles. Le coach peut supprimer un créneau ou une activité ; les participants
        sont alors invités à consulter leur espace.
      </p>

      <h2>7. Droit de rétractation</h2>
      <p>
        Les réservations étant gratuites et l&apos;annulation libre jusqu&apos;au début de la séance, l&apos;utilisateur n&apos;a pas à exercer de droit de rétractation.
        Pour une prestation de loisirs à date déterminée, l&apos;article L221-28 12° du Code de la consommation exclut en tout état de cause ce droit.
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        SportRadar ne saurait être tenu responsable de la réalisation des activités présentées. L&apos;utilisateur s&apos;assure que son état de
        santé lui permet de pratiquer l&apos;activité choisie.
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Les données collectées dans le cadre des réservations (identité, e-mail, réservations) sont utilisées uniquement pour le
        fonctionnement de la plateforme, conformément au RGPD. Voir la <a className="text-primary-700 underline" href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>10. Médiation et litiges</h2>
      <p>
        En cas de litige, l&apos;utilisateur peut contacter SportRadar à contact@sportradar.com afin de rechercher une solution amiable. Les
        présentes CGV sont soumises au droit français.
      </p>

      <h2>11. Modification des conditions</h2>
      <p>SportRadar se réserve le droit de modifier les présentes conditions. Les CGV applicables sont celles acceptées lors de la réservation.</p>

      <h2>12. Contact</h2>
      <p>Pour toute question concernant ces conditions : contact@sportradar.com</p>
    </LegalPage>
  );
}
