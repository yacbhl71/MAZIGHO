import { describe, expect, it } from "vitest";
import {
  ALGERIA_STANDARD_CURRENCY_RATE_BPS,
  buildAlgeriaStandardStoreTemplate,
  normalizeStoreProvisioningTemplate,
} from "./algeriaStoreTemplate";

describe("Algeria standard store template", () => {
  it("creates an isolated operational starting point without activating payment", () => {
    const template = buildAlgeriaStandardStoreTemplate("2026-09-28T00:00:00.000Z");

    expect(template.market).toMatchObject({
      primaryLanguage: "fr",
      activeLanguages: ["fr", "ar"],
      primaryCountry: "DZ",
      activeCountries: ["DZ"],
    });
    expect(template.shippingReturns.servedCountries).toEqual(["DZ"]);
    expect(template.currency).toEqual({ code: "DZD", rateBps: ALGERIA_STANDARD_CURRENCY_RATE_BPS, rateReviewRequired: true });
    expect(template.wilayaDelivery.rates).toHaveLength(69);
    expect(template.wilayaDelivery.rates.filter(rate => rate.enabled)).toHaveLength(54);
    expect(template.cashOnDelivery.enabled).toBe(false);
    expect(template.onlinePaymentPreparation).toMatchObject({
      merchantEligibilityConfirmed: false,
      acquirerContractConfirmed: false,
      testAccessReceived: false,
      certificationCompleted: false,
    });
  });

  it("does not infer an Algeria template from arbitrary input", () => {
    expect(normalizeStoreProvisioningTemplate("algeria")).toBe("algeria");
    expect(normalizeStoreProvisioningTemplate("other")).toBe("standard");
    expect(normalizeStoreProvisioningTemplate(null)).toBe("standard");
  });
});
