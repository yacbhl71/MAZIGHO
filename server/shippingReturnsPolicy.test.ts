import { describe, expect, it } from "vitest";
import { getShippingTermsPresentation } from "../client/src/lib/shippingReturnsPolicy";

const fallback = {
  fallbackZones: "Zones à confirmer.",
  fallbackDetails: "Délais à confirmer.",
  fallbackReturns: "Retours à confirmer.",
  formatPrice: (amount: number) => `${amount / 100} CHF`,
};

describe("shipping returns policy presentation", () => {
  it("uses the owner delivery rules as the public default", () => {
    expect(getShippingTermsPresentation({
      ...fallback,
      countryLabels: ["Suisse", "France"],
      policy: {
        mode: "flat_rate",
        flatShippingRateCents: 650,
        freeShippingThresholdCents: 8000,
        servedCountries: ["CH", "FR"],
        deliveryLeadTime: "2 à 4 jours ouvrables",
        returnsSummary: "Retour accepté sous 14 jours.",
      },
    })).toEqual({
      zones: "Livraison actuellement annoncée vers Suisse · France. Seules ces destinations sont desservies par cette boutique.",
      pricing: "Les frais de livraison sont de 6.5 CHF. Ils sont offerts dès 80 CHF d’achat.",
      deliveryLeadTime: "2 à 4 jours ouvrables",
      returns: "Retour accepté sous 14 jours.",
    });
  });

  it("uses the legal profile only when no owner delivery rule exists", () => {
    expect(getShippingTermsPresentation({ ...fallback, countryLabels: [] })).toMatchObject({
      zones: "Zones à confirmer.",
      pricing: "La livraison est incluse dans le prix affiché, selon les destinations annoncées.",
      deliveryLeadTime: "Délais à confirmer.",
      returns: "Retours à confirmer.",
    });
  });
});
