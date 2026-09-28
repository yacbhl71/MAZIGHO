import { describe, expect, it } from "vitest";
import { getAlgeriaCashOnDeliveryEligibility, getAlgeriaOnlinePaymentPreparationStatus, makeAlgeriaCashOnDeliverySettings, makeAlgeriaOnlinePaymentPreparation, parseAlgeriaCashOnDeliverySettings, parseAlgeriaOnlinePaymentPreparation } from "../../shared/algeriaCashOnDelivery";

describe("Algeria cash-on-delivery policy", () => {
  it("requires the visible DZ market, delivery grid, dinar currency and checkout legal readiness", () => {
    expect(getAlgeriaCashOnDeliveryEligibility({ activeCountries: ["CH", "DZ"], servedCountries: ["DZ"], wilayaDeliveryConfigured: true, dzdCurrencyConfigured: true, legalReady: true })).toEqual({
      eligible: true,
      marketEnabled: true,
      deliveryEnabled: true,
      wilayaDeliveryConfigured: true,
      dzdCurrencyConfigured: true,
      legalReady: true,
      missing: [],
    });
    expect(getAlgeriaCashOnDeliveryEligibility({ activeCountries: ["DZ"], servedCountries: [], wilayaDeliveryConfigured: false, dzdCurrencyConfigured: false, legalReady: false })).toMatchObject({
      eligible: false,
      missing: ["livraison", "grille_wilayas", "devise_dzd", "informations_légales"],
    });
  });

  it("stores an explicit owner setting and safely rejects malformed legacy values", () => {
    expect(makeAlgeriaCashOnDeliverySettings(true, "2026-09-28T00:00:00.000Z")).toEqual({ enabled: true, enabledAt: "2026-09-28T00:00:00.000Z" });
    expect(parseAlgeriaCashOnDeliverySettings("{bad")).toEqual({ enabled: false, enabledAt: null });
    expect(parseAlgeriaCashOnDeliverySettings(JSON.stringify({ enabled: true, enabledAt: "invalid" }))).toEqual({ enabled: true, enabledAt: null });
  });

  it("tracks local gateway preparation without storing gateway credentials or activating a payment", () => {
    const preparation = makeAlgeriaOnlinePaymentPreparation({ merchantEligibilityConfirmed: true, acquirerContractConfirmed: true, testAccessReceived: true, certificationCompleted: true }, "2026-09-28T02:00:00.000Z");
    expect(getAlgeriaOnlinePaymentPreparationStatus(preparation, true)).toEqual({ completed: 5, total: 5, readyForProviderActivation: true });
    expect(parseAlgeriaOnlinePaymentPreparation("not-json")).toMatchObject({ merchantEligibilityConfirmed: false, certificationCompleted: false, updatedAt: null });
  });
});
