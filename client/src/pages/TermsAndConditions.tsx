import LegalLayout from "@/components/LegalLayout";
import { useLegalProfile } from "@/hooks/useLegalProfile";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import { useStorePrice } from "@/hooks/useStorePrice";
import { trpc } from "@/lib/trpc";

const updatedAt = "28 septembre 2026";

export default function TermsAndConditions() {
  const { profile } = useLegalProfile();
  const { profile: designProfile, palette } = useDesignProfile();
  const { currencyCode } = useStorePrice();
  const paymentAvailability = trpc.storefront.getPaymentAvailability.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const brandName = designProfile.brandName?.trim() || "La boutique";
  const paymentEnabled = paymentAvailability.data?.enabled === true;
  const paymentLabel = paymentAvailability.data?.mode === "stripe_connect_live" ? "Stripe Connect" : "Stripe Connect en environnement de test";

  return (
    <LegalLayout
      eyebrow="Cadre de vente"
      title="Conditions générales"
      description={`Ces conditions encadrent l’utilisation de ${brandName} et s’appliquent dans leur version affichée au moment d’une commande.`}
      updatedAt={updatedAt}
    >
      <section>
        <h2 className="text-xl font-semibold text-slate-950">1. Champ d’application</h2>
        <p className="mt-3">
          Les présentes conditions générales régissent l’utilisation de la boutique {brandName} et les ventes conclues entre {profile.operatorName}, exploitant de {brandName}, et ses clients consommateurs. Elles s’appliquent dans leur version affichée au moment de la validation d’une commande.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">2. Parcours de commande</h2>
        <p className="mt-3">
          {paymentEnabled
            ? <>Le parcours de commande permet de vérifier le panier, la destination, les frais de livraison éventuels et le montant avant redirection vers {paymentLabel}. Une confirmation de commande est ensuite accessible dans l’espace client.</>
            : <>Le paiement en ligne n’est pas activé pour cette boutique à cet instant. La boutique peut rester consultable et les informations de livraison restent visibles, sans encaissement ni commande finalisée.</>}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">3. Produits et informations</h2>
        <p className="mt-3">
          Chaque fiche produit présente les caractéristiques essentielles, le prix, les variantes éventuellement disponibles et les informations utiles à la décision d’achat. Les visuels sont illustratifs. Le client vérifie ces informations avant de confirmer sa commande.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">4. Prix</h2>
        <p className="mt-3">
          Les prix affichés sur la boutique sont exprimés dans la devise affichée par la boutique ({currencyCode}), sauf indication contraire. Les frais obligatoires, les frais de livraison éventuels et les conditions de paiement applicables sont présentés avant la validation définitive d’une commande.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">5. Commande et formation du contrat</h2>
        <p className="mt-3">
          Le client peut vérifier le contenu de son panier, corriger les erreurs de saisie et consulter le montant applicable avant de s’engager. L’acceptation des présentes conditions et des règles de livraison est demandée avant la redirection de paiement. La confirmation de commande et les principaux éléments du contrat restent accessibles dans l’espace client après validation.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">6. Paiement</h2>
        <p className="mt-3">
          {paymentEnabled
            ? <>Le paiement est traité par {paymentLabel}, pour le compte de l’exploitant de {brandName}. {brandName} ne recueille ni ne stocke les données de carte bancaire.</>
            : <>Les moyens de paiement seront indiqués lorsque l’exploitant activera un prestataire de paiement sécurisé. {brandName} ne demande aucune donnée de carte bancaire tant que le paiement en ligne n’est pas disponible.</>}
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
