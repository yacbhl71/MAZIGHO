import LegalLayout from "@/components/LegalLayout";
import { useLegalProfile } from "@/hooks/useLegalProfile";
import { useStoreSystemPages } from "@/hooks/useStoreSystemPages";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import { useStorePrice } from "@/hooks/useStorePrice";
import { useLocale } from "@/contexts/LocaleContext";
import { trpc } from "@/lib/trpc";
import { storefrontCountryChoices } from "@shared/storeMarketSettings";
import { getShippingTermsPresentation } from "@/lib/shippingReturnsPolicy";

const updatedAt = "25 septembre 2026";

export default function ShippingReturns() {
  const { profile } = useLegalProfile();
  const { profile: designProfile, palette } = useDesignProfile();
  const { pages } = useStoreSystemPages();
  const { locale } = useLocale();
  const { formatStorePrice } = useStorePrice();
  const shippingPolicy = trpc.content.getCheckoutShippingPolicy.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
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
      </LegalLayout>
    );
  }

  return (
    <LegalLayout
      eyebrow="Informations pratiques"
      title="Livraison et retours"
      description={`Cette page présente l’état actuel des modalités de livraison et de retours de ${brandName} avant l’ouverture des paiements en ligne.`}
      updatedAt={updatedAt}
    >
      <section>
        <h2 className="text-xl font-semibold text-slate-950">1. État actuel</h2>
        <p className="mt-3">
          Les conditions ci-dessous correspondent aux réglages actuellement enregistrés pour {brandName}. L’encaissement en ligne reste désactivé : cette page n’active aucun paiement, transporteur, expédition ni remboursement.
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
