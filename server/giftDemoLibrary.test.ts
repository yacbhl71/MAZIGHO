import { describe, expect, it } from "vitest";
import {
  getGiftDemoLibraryKit,
  getGiftDemoLibraryKitForDraft,
  getGiftDemoLibraryProductCount,
  getGiftDemoLibraryVariantCount,
} from "../shared/giftDemoLibrary";

describe("gift demo library", () => {
  it("provides a complete local-market kit for the matching factory model", () => {
    const kit = getGiftDemoLibraryKit("local_market");

    expect(kit).toMatchObject({
      label: "Épicerie & livraison locale",
      businessType: "autre",
      factoryModel: "local_market",
      setupKey: "local_market_demo_setup",
    });
    expect(kit?.categories.map(category => category.slug)).toEqual([
      "fruits-legumes",
      "epicerie-boissons",
      "frais-boucherie-poissonnerie",
      "pizza-traiteur",
      "maison-hygiene",
    ]);
    expect(getGiftDemoLibraryProductCount(kit!)).toBe(5);
    expect(getGiftDemoLibraryVariantCount(kit!)).toBe(15);
    expect(new Set(kit?.products.map(product => product.categorySlug))).toEqual(new Set(kit?.categories.map(category => category.slug)));
    expect(kit?.products.every(product => product.name.startsWith("Démonstration —") && product.imageUrl.startsWith("https://"))).toBe(true);
  });

  it("selects the local-market kit only for its matching draft model", () => {
    expect(getGiftDemoLibraryKitForDraft({ businessType: "autre", factoryModel: "local_market" })?.id).toBe("local_market");
    expect(getGiftDemoLibraryKitForDraft({ businessType: "autre", factoryModel: "gourmet" })?.id).toBe("gourmet");
  });
});
