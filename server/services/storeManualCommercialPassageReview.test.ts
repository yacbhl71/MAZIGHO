import { describe, expect, it } from "vitest";
import { buildStoreManualCommercialPassageReview } from "./storeManualCommercialPassageReview";

describe("buildStoreManualCommercialPassageReview", () => {
  it("bloque la revue humaine si la préparation ou l’isolement ne sont pas prêts", () => {
    const result = buildStoreManualCommercialPassageReview({
      commercialPreparationReady: false,
      commercialBlockedCount: 2,
      setupIsolated: false,
    });

    expect(result.blockedCount).toBe(2);
    expect(result.mayRequestManualPublicationReview).toBe(false);
    expect(result.cataloguePublicationExecuted).toBe(false);
    expect(result.publicCartExecuted).toBe(false);
    expect(result.publicActivationExecuted).toBe(false);
  });

  it("autorise seulement la demande de revue humaine lorsque les deux prévols sont prêts", () => {
    const result = buildStoreManualCommercialPassageReview({
      commercialPreparationReady: true,
      commercialBlockedCount: 0,
      setupIsolated: true,
    });

    expect(result.mayRequestManualPublicationReview).toBe(true);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "visuals_variants", state: "manual" }),
      expect.objectContaining({ key: "delivery_stock_returns", state: "manual" }),
      expect.objectContaining({ key: "legal_domain", state: "manual" }),
      expect.objectContaining({ key: "explicit_decision", state: "manual" }),
    ]));
    expect(result.cataloguePublicationExecuted).toBe(false);
    expect(result.publicCartExecuted).toBe(false);
    expect(result.publicActivationExecuted).toBe(false);
  });
});
