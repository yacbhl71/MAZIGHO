import LegalLayout from "@/components/LegalLayout";
import { useLegalProfile } from "@/hooks/useLegalProfile";
import { useStoreSystemPages } from "@/hooks/useStoreSystemPages";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import { useStorePrice } from "@/hooks/useStorePrice";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import { storefrontCountryChoices } from "@shared/storeMarketSettings";
import { getShippingTermsPresentation } from "@/lib/shippingReturnsPolicy";

const updatedAt = "28 septembre 2026";

export default function ShippingReturns() {
  const { profile } = useLegalProfile();
  const { profile: designProfile, palette } = useDesignProfile();
  const { pages } = useStoreSystemPages();
  const { locale } = useLocale();
  const { formatStorePrice } = useStorePrice();
  const shippingPolicy = trpc.content.getCheckoutShippingPolicy.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const paymentAvailability = trpc.storefront.getPaymentAvailability.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const storeReturns = pages?.returns ?? null;
  const brandName = designProfile.brandName?.trim() || "La boutique";
  const shippingTerms = getShippingTermsPresentation({
    policy: shippingPolicy.data,
    countryLabels: (shippingPolicy.data?.servedCountries ?? []).map(code => storefrontCountryChoices.find(country => country.code === code)?.label),
    fallbackZones: profile.deliveryZones,
    fallbackDetails: profile.deliveryDetails,
    fallbackReturns: profile.returnsPolicy,
    formatPrice: amountCents => formatStorePrice(amountCents, locale),
  });
  const paymentEnabled = paymentAvailability.data?.enabled === true;
  const returnRequestsEnabled = shippingPolicy.data?.returnRequestsEnabled === true;

  // A boutique that wrote its own shipping/returns page replaces the default
  // legal-profile-driven sections entirely.
  if (storeReturns) {
    return (
      <LegalLayout
        eyebrow="Informations pratiques"
        title={storeReturns.title || "Livraison et retours"}
        description=""
        updatedAt={updatedAt}
      >
        <section>
          <p className="mt-3 whitespace-pre-line">{storeReturns.body}</p>
        </section>
        <section className={returnRequestsEnabled ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950" : "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"}>
          {returnRequestsEnabled ? <>Les demandes de retour sont activées : après connexion, ouvrez <a className="font-semibold underline underline-offset-4" style={{ color: palette.primary }} href="/commandes">Mes commandes</a> pour sélectionner les articles concernés. La boutique vous répondra avec ses instructions.</> : <>Les demandes de retour en ligne ne sont pas activées pour cette boutique. Utilisez le contact indiqué dans ses conditions pour toute question.</>}
        </section>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout
      eyebrow="Informations pratiques"
      title="Livraison et retours"
      description={`Cette page présente les modalités de livraison et de retours communiquées par ${brandName}.`}
      updatedAt={updatedAt}
    >
      <section>
        <h2 className="text-xl font-semibold text-slate-950">1. Informations applicables</h2>
        <p className="mt-3">
          {paymentEnabled
            ? <>Les conditions ci-dessous correspondent aux réglages affichés par {brandName} avant la validation d’une commande. Cette page informe sur la livraison et les retours ; elle ne déclenche ni expédition, ni transporteur, ni remboursement automatique.</>
            : <>Les conditions ci-dessous correspondent aux réglages actuellement enregistrés pour {brandName}. Le paiement en ligne n’est pas disponible pour cette boutique à cet instant ; cette page n’active aucun paiement, transporteur, expédition ni remboursement.</>}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">2. Zones de livraison</h2>
        <p className="mt-3">
          {shippingTerms.zones}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">3. Frais et délai indicatif</h2>
        <p className="mt-3">
          {shippingTerms.pricing} {shippingTerms.deliveryLeadTime}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">4. Retours</h2>
        <p className="mt-3">
          {shippingTerms.returns} Cette position ne limite pas les droits impératifs qui pourraient résulter du droit applicable lorsqu’un produit est défectueux ou ne correspond pas à ce qui a été convenu.
        </p>
        <p className={`mt-4 rounded-xl border p-4 text-sm leading-6 ${returnRequestsEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
          {returnRequestsEnabled ? <>Les demandes de retour sont activées : après connexion, ouvrez <a className="font-semibold underline underline-offset-4" style={{ color: palette.primary }} href="/commandes">Mes commandes</a> pour sélectionner les articles concernés. La boutique vous répondra ensuite avec ses instructions.</> : <>Les demandes de retour en ligne ne sont pas activées pour cette boutique. Pour toute question, utilisez le contact indiqué ci-dessous.</>}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-slate-950">5. Assistance</h2>
        <p className="mt-3">
          Pour une question concernant la livraison annoncée, écrivez à <a className="underline underline-offset-4 hover:opacity-75" style={{ color: palette.primary }} href={`mailto:${profile.contactEmail}`}>{profile.contactEmail}</a> ou utilisez le formulaire de contact. Les présentes informations peuvent être mises à jour par l’exploitant de la boutique.
        </p>
      </section>
    </LegalLayout>
  );
}
