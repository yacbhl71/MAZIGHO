import LegalLayout from "@/components/LegalLayout";
import { useLegalProfile } from "@/hooks/useLegalProfile";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import { useStorePrice } from "@/hooks/useStorePrice";

const updatedAt = "25 septembre 2026";

export default function TermsAndConditions() {
  const { profile } = useLegalProfile();
  const { profile: designProfile, palette } = useDesignProfile();
  const { currencyCode } = useStorePrice();
  const brandName = designProfile.brandName?.trim() || "La boutique";

  return (
    <LegalLayout
      eyebrow="Cadre de vente"
      title="Conditions générales"
      description={`Ces conditions encadrent l’utilisation de ${brandName} et seront appliquées aux commandes lorsque le paiement en ligne sera officiellement ouvert.`}
      updatedAt={updatedAt}
    >
      <section>
        <h2 className="text-xl font-semibold text-slate-950">1. Champ d’application</h2>
        <p className="mt-3">
          Les présentes conditions générales régissent l’utilisation de la boutique {brandName} et les futures ventes conclues entre {profile.operatorName}, exploitant de {brandName}, et ses clients consommateurs. Elles s’appliqueront dans leur version affichée au moment de la validation d’une commande.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">2. État actuel du parcours de commande</h2>
        <p className="mt-3">
          Le paiement en ligne n’est pas encore actif. La page de commande est présentée à titre d’information et ne permet actuellement ni d’encaisser un paiement, ni d’enregistrer une commande, ni de collecter une adresse de livraison. Les conditions définitives seront complétées avant l’ouverture effective des ventes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">3. Produits et informations</h2>
        <p className="mt-3">
          Chaque fiche produit a vocation à présenter les caractéristiques essentielles, le prix, les variantes éventuellement disponibles et les informations utiles à la décision d’achat. Les visuels sont illustratifs. Avant toute commande active, {brandName} indiquera de manière claire les informations indispensables à la conclusion du contrat.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">4. Prix</h2>
        <p className="mt-3">
          Les prix affichés sur la boutique sont exprimés dans la devise affichée par la boutique ({currencyCode}), sauf indication contraire. Les frais obligatoires, les frais de livraison éventuels et les conditions de paiement applicables devront être présentés de façon visible avant toute validation définitive d’une commande.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">5. Commande et formation du contrat</h2>
        <p className="mt-3">
          Lorsque le parcours de commande sera activé, le client pourra vérifier le contenu de son panier, corriger les erreurs de saisie et consulter le montant applicable avant de s’engager. La confirmation de commande et les principaux éléments du contrat seront communiqués par voie électronique après validation.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">6. Paiement</h2>
        <p className="mt-3">
          Les moyens de paiement acceptés ne seront indiqués qu’après l’intégration effective d’un prestataire de paiement sécurisé. {brandName} ne demande actuellement aucune donnée de carte bancaire sur son site.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">7. Livraison et retours</h2>
        <p className="mt-3">
          Zones de livraison envisagées : {profile.deliveryZones}. {profile.deliveryDetails} Politique actuelle de retours : {profile.returnsPolicy} Les droits légaux impératifs applicables en cas de produit défectueux restent réservés.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">8. Responsabilité</h2>
        <p className="mt-3">
          {brandName} s’efforce de maintenir des informations exactes et un site accessible. Dans les limites du droit applicable, {brandName} ne peut toutefois garantir l’absence totale d’interruption, d’erreur technique ou de disponibilité permanente des produits présentés.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">9. Droit applicable et contact</h2>
        <p className="mt-3">
          Les présentes conditions sont soumises au droit applicable dans le pays déclaré par l’exploitant ({profile.country}), sous réserve des dispositions impératives de protection du consommateur applicables au client. Pour toute question, contactez {brandName} à <a className="underline underline-offset-4 hover:opacity-75" style={{ color: palette.primary }} href={`mailto:${profile.contactEmail}`}>{profile.contactEmail}</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
