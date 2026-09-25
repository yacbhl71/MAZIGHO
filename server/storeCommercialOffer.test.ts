import { describe, expect, it } from "vitest";
import { normalizeStoreCommercialOfferMode, storeCommercialOfferModeLabels } from "../shared/storeCommercialOffer";

describe("store commercial offer mode", () => {
  it("keeps the three non-billing modes explicit", () => {
    expect(storeCommercialOfferModeLabels.undecided).toBe("À définir");
    expect(storeCommercialOfferModeLabels.rental).toBe("Location SaaS");
    expect(storeCommercialOfferModeLabels.perpetual_sale).toBe("Vente définitive");
  });

  it("fails closed to undecided for absent or unrecognized storage", () => {
    expect(normalizeStoreCommercialOfferMode(null)).toBe("undecided");
    expect(normalizeStoreCommercialOfferMode("subscription_live")).toBe("undecided");
  });
});
