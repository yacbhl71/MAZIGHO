import LegalLayout from "@/components/LegalLayout";
import { useLegalProfile } from "@/hooks/useLegalProfile";

const updatedAt = "23 août 2026";

export default function PrivacyPolicy() {
  const { profile } = useLegalProfile();

  return (
    <LegalLayout
      eyebrow="Données personnelles"
      title="Politique de confidentialité"
      description="Cette politique explique quelles données MAZIGHO traite, pourquoi elles sont utilisées et comment exercer vos droits."
      updatedAt={updatedAt}
    >
      <section>
        <h2 className="text-xl font-semibold text-slate-950">1. Responsable du traitement</h2>
        <p className="mt-3">
          Le responsable du traitement des données personnelles est <strong>{profile.operatorName}</strong>, exploitant de MAZIGHO, {profile.addressLine}, {profile.postalCodeCity}, {profile.country}. Pour toute demande relative aux données personnelles, écrivez à <a className="text-orange-700 underline underline-offset-4 hover:text-orange-500" href={`mailto:${profile.contactEmail}`}>{profile.contactEmail}</a>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">2. Données traitées</h2>
        <p className="mt-3">Selon votre utilisation du site, MAZIGHO peut traiter les catégories de données suivantes :</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>les informations de compte, telles que le nom, l’adresse e-mail et les informations nécessaires à la connexion ;</li>
          <li>les informations que vous saisissez dans un formulaire de contact ;</li>
          <li>les informations de commande et, lorsque le parcours de commande sera activé, les informations nécessaires à la livraison et à la facturation ;</li>
          <li>les données techniques strictement nécessaires au fonctionnement du site, notamment la session, le panier et les préférences enregistrées dans votre navigateur.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">3. Finalités du traitement</h2>
        <p className="mt-3">Ces données sont utilisées uniquement pour créer et sécuriser un compte, répondre aux demandes, gérer une commande lorsqu’elle est disponible, prévenir les abus, assurer le fonctionnement technique du site et respecter les obligations légales applicables.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">4. Destinataires et infrastructure</h2>
        <p className="mt-3">
          Les données ne sont pas vendues à des tiers. Elles peuvent être traitées par les prestataires techniques nécessaires à l’hébergement de la boutique, à l’infrastructure de base de données et, une fois activé, à l’envoi des e-mails transactionnels. Ces prestataires n’accèdent aux données que dans la mesure nécessaire à leur mission technique.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">5. Cookies et stockage local</h2>
        <p className="mt-3">
          MAZIGHO utilise des mécanismes techniques nécessaires au fonctionnement du site, par exemple pour maintenir une session sécurisée ou conserver le panier et les favoris dans le navigateur. Si des outils non essentiels de mesure d’audience ou de marketing sont activés ultérieurement, cette politique et, si nécessaire, les choix de consentement seront mis à jour avant leur utilisation.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">6. Durée de conservation</h2>
        <p className="mt-3">
          Les données sont conservées uniquement aussi longtemps que nécessaire pour la finalité concernée, la gestion de la relation client, la sécurité du service ou le respect d’une obligation légale. Elles sont ensuite supprimées ou anonymisées lorsque leur conservation n’est plus nécessaire.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">7. Vos droits</h2>
        <p className="mt-3">
          Vous pouvez demander l’accès à vos données, leur rectification, leur suppression lorsque les conditions sont réunies, ou des informations sur leur traitement. Pour exercer ces droits, contactez MAZIGHO à l’adresse indiquée ci-dessus. Une réponse pourra nécessiter une vérification raisonnable de votre identité afin de protéger vos données.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">8. Mise à jour de cette politique</h2>
        <p className="mt-3">
          Cette politique peut être modifiée lorsque les fonctionnalités de la boutique évoluent, notamment lors de l’activation des paiements en ligne ou des e-mails transactionnels. La date de dernière mise à jour figure en haut de cette page.
        </p>
      </section>
    </LegalLayout>
  );
}
