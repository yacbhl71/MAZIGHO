import { describe, expect, it } from "vitest";
import { buildStoreCommercialPublicationPreflight } from "./storeCommercialPublicationPreflight";

describe("buildStoreCommercialPublicationPreflight", () => {
  it("bloque une préparation incomplète sans ouvrir de capacité commerciale", () => {
    const result = buildStoreCommercialPublicationPreflight({
      status: "setup",
      hasSavedBuilderConfiguration: false,
      collectionCount: 0,
      hasSavedProducts: false,
      productCount: 0,
      pricedProductCount: 0,
      hasSavedOperations: false,
      cartEligibleProductCount: 0,
    });

    expect(result.blockedCount).toBeGreaterThan(0);
    expect(result.locallyReadyForManualCommercialReview).toBe(false);
    expect(result.cataloguePublicationExecuted).toBe(false);
    expect(result.publicCartExecuted).toBe(false);
    expect(result.publicActivationExecuted).toBe(false);
  });

  it("signale une préparation complète seulement pour une revue manuelle distincte", () => {
    const result = buildStoreCommercialPublicationPreflight({
      status: "setup",
      hasSavedBuilderConfiguration: true,
      collectionCount: 2,
      hasSavedProducts: true,
      productCount: 3,
      pricedProductCount: 3,
      hasSavedOperations: true,
      cartEligibleProductCount: 2,
    });

    expect(result.blockedCount).toBe(0);
    expect(result.manualCount).toBe(2);
    expect(result.locallyReadyForManualCommercialReview).toBe(true);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "catalogue_publication", state: "manual" }),
      expect.objectContaining({ key: "public_activation", state: "manual" }),
    ]));
    expect(result.cataloguePublicationExecuted).toBe(false);
    expect(result.publicCartExecuted).toBe(false);
    expect(result.publicActivationExecuted).toBe(false);
  });

  it("refuse le prévol si la boutique n’est plus en préparation", () => {
    const result = buildStoreCommercialPublicationPreflight({
      status: "active",
      hasSavedBuilderConfiguration: true,
      collectionCount: 1,
      hasSavedProducts: true,
      productCount: 1,
      pricedProductCount: 1,
      hasSavedOperations: true,
      cartEligibleProductCount: 1,
    });

    expect(result.checks).toEqual(expect.arrayContaining([expect.objectContaining({ key: "store_setup", state: "blocked" })]));
    expect(result.locallyReadyForManualCommercialReview).toBe(false);
  });
});
