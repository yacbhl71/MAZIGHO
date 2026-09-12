import { describe, expect, it } from "vitest";
import { buildStoreActivationPreflight } from "./storeActivationPreflight";

const readyAnimalGift = {
  status: "setup" as const,
  isGiftProvisioned: true,
  businessType: "animalier" as const,
  primaryDomain: "pattes-exemple.ch",
  hasActiveOwner: true,
  hasOwnDesignProfile: true,
  brandName: "Pattes & Compagnie",
  hasOwnLegalProfile: true,
  categoryCount: 2,
  activeProductCount: 4,
  sellableProductCount: 4,
  activeProductWithImageCount: 4,
  productWithVariantsCount: 1,
  hasCurrency: true,
};

describe("store activation preflight", () => {
  it("is locally ready only when every local prerequisite is met", () => {
    const result = buildStoreActivationPreflight(readyAnimalGift);
    expect(result.blockedCount).toBe(0);
    expect(result.locallyReadyForManualActivation).toBe(true);
    expect(result.publicActivationExecuted).toBe(false);
    expect(result.checks.filter(check => check.state === "manual").map(check => check.key)).toEqual(["domain_manual", "variants_manual", "shipping_returns_manual", "operator_confirmation"]);
  });

  it("blocks a setup boutique until owner, own branding, legal profile and catalogue are complete", () => {
    const result = buildStoreActivationPreflight({
      ...readyAnimalGift,
      hasActiveOwner: false,
      hasOwnDesignProfile: false,
      brandName: "MAZIGHO",
      hasOwnLegalProfile: false,
      categoryCount: 0,
      activeProductCount: 0,
      sellableProductCount: 0,
      activeProductWithImageCount: 0,
    });
    expect(result.locallyReadyForManualActivation).toBe(false);
    expect(result.checks.filter(check => check.state === "blocked").map(check => check.key)).toEqual(expect.arrayContaining(["owner", "brand", "legal", "catalogue", "sellable_catalogue", "product_images"]));
  });

  it("rejects a local or test domain and the wrong business universe", () => {
    const result = buildStoreActivationPreflight({ ...readyAnimalGift, primaryDomain: "animalier.local", businessType: "bijoux" });
    expect(result.locallyReadyForManualActivation).toBe(false);
    expect(result.checks.find(check => check.key === "domain_format")?.state).toBe("blocked");
    expect(result.checks.find(check => check.key === "animalier_scope")?.state).toBe("blocked");
  });
});
