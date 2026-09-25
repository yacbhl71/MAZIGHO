import type { PublicCheckoutShippingPolicy } from "@/lib/checkoutShipping";

export function getShippingTermsPresentation(input: {
  policy?: PublicCheckoutShippingPolicy;
  countryLabels: (string | undefined)[];
  fallbackZones: string;
  fallbackDetails: string;
  fallbackReturns: string;
  formatPrice: (amountCents: number) => string;
}) {
  const { policy } = input;
  const servedCountries = policy?.servedCountries ?? [];
  const namedCountries = input.countryLabels.filter((country): country is string => Boolean(country));
  const zones = servedCountries.length > 0
    ? `Livraison actuellement annoncée vers ${namedCountries.length ? namedCountries.join(" · ") : servedCountries.join(" · ")}. Seules ces destinations sont desservies par cette boutique.`
    : input.fallbackZones;

  const pricing = policy?.mode === "flat_rate" && policy.flatShippingRateCents > 0
    ? policy.freeShippingThresholdCents > 0
      ? `Les frais de livraison sont de ${input.formatPrice(policy.flatShippingRateCents)}. Ils sont offerts dès ${input.formatPrice(policy.freeShippingThresholdCents)} d’achat.`
      : `Les frais de livraison sont de ${input.formatPrice(policy.flatShippingRateCents)} par commande.`
    : "La livraison est incluse dans le prix affiché, selon les destinations annoncées.";

  return {
    zones,
    pricing,
    deliveryLeadTime: policy?.deliveryLeadTime?.trim() || input.fallbackDetails,
    returns: policy?.returnsSummary?.trim() || input.fallbackReturns,
  };
}
