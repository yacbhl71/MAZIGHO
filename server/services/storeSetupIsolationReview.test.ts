import { describe, expect, it } from "vitest";
import { buildStoreSetupIsolationReview } from "./storeSetupIsolationReview";

describe("buildStoreSetupIsolationReview", () => {
  it("confirme l’isolement prévu pour une boutique en setup", () => {
    const result = buildStoreSetupIsolationReview({ status: "setup" });

    expect(result.protectedSetup).toBe(true);
    expect(result.publicStorefrontServed).toBe(false);
    expect(result.publicCartAvailable).toBe(false);
    expect(result.publicCheckoutAvailable).toBe(false);
    expect(result.cataloguePublicationExecuted).toBe(false);
    expect(result.manualChecks).toHaveLength(3);
  });

  it("ne présente pas une boutique active comme isolée", () => {
    const result = buildStoreSetupIsolationReview({ status: "active" });

    expect(result.protectedSetup).toBe(false);
    expect(result.publicStorefrontServed).toBe(true);
    expect(result.publicCartAvailable).toBe(false);
    expect(result.publicCheckoutAvailable).toBe(false);
    expect(result.cataloguePublicationExecuted).toBe(false);
  });
});
