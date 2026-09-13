import { describe, expect, it } from "vitest";
import {
  DEFAULT_OWNER_SHIPPING_RETURNS_SETTINGS,
  describeShippingPreview,
  normalizeOwnerShippingReturnsSettings,
  parseOwnerShippingReturnsSettings,
} from "./ownerShippingReturns";

describe("owner shipping and returns settings", () => {
  it("keeps the safe included-delivery default for malformed stored data", () => {
    expect(parseOwnerShippingReturnsSettings("not-json")).toEqual(DEFAULT_OWNER_SHIPPING_RETURNS_SETTINGS);
  });

  it("normalizes a fixed delivery profile without carrier, supplier or payment data", () => {
    const settings = normalizeOwnerShippingReturnsSettings({
      mode: "flat_rate",
      flatShippingRateCents: 490,
      freeShippingThresholdCents: 5000,
      servedCountries: ["ch", "FR", "ch", "invalid-country"],
      deliveryLeadTime: "  2 à 4 jours ouvrables  ",
      returnsSummary: "  Retour sous 14 jours après réception.  ",
    });

    expect(settings).toEqual({
      mode: "flat_rate",
      flatShippingRateCents: 490,
      freeShippingThresholdCents: 5000,
      servedCountries: ["CH", "FR"],
      deliveryLeadTime: "2 à 4 jours ouvrables",
      returnsSummary: "Retour sous 14 jours après réception.",
    });
    expect(describeShippingPreview(settings, "CHF")).toEqual({
      title: "Tarif fixe : 4.90 CHF",
      detail: "Livraison offerte à partir de 50.00 CHF.",
    });
  });

  it("clears rate and threshold when delivery is included", () => {
    expect(normalizeOwnerShippingReturnsSettings({
      mode: "included",
      flatShippingRateCents: 490,
      freeShippingThresholdCents: 5000,
    })).toMatchObject({
      mode: "included",
      flatShippingRateCents: 0,
      freeShippingThresholdCents: 0,
    });
  });
});
