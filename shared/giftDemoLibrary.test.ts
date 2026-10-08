import { describe, expect, it } from "vitest";
import {
  giftDemoLibraryInternalSupplier,
  giftDemoLibraryKitIds,
  giftDemoLibraryKits,
  getGiftDemoLibraryKit,
  getGiftDemoLibraryKitForDraft,
  getGiftDemoLibraryProductCount,
  getGiftDemoLibraryVariantCount,
} from "./giftDemoLibrary";

describe("gift demo library", () => {
  it("expose sept kits cohérents avec trois catégories, trois fiches et neuf variantes", () => {
    expect(giftDemoLibraryKits.map(kit => kit.id)).toEqual(giftDemoLibraryKitIds);
    expect(new Set(giftDemoLibraryKits.map(kit => kit.setupKey)).size).toBe(giftDemoLibraryKits.length);

    for (const kit of giftDemoLibraryKits) {
      expect(kit.categories).toHaveLength(3);
      expect(getGiftDemoLibraryProductCount(kit)).toBe(3);
      expect(getGiftDemoLibraryVariantCount(kit)).toBe(9);

      for (const product of kit.products) {
        expect(kit.categories.map(category => category.slug)).toContain(product.categorySlug);
        expect(product.name).toMatch(/^Démonstration —/);
        expect(product.description).toContain("tester");
        expect(product.longDescription).toContain("fictif");
        expect(product.imageUrl).toMatch(/^https:\/\/files\.manuscdn\.com\//);
        expect(product.priceCents).toBeGreaterThan(0);
        expect(product.originalPriceCents).toBeGreaterThan(product.priceCents);
        expect(product.stock).toBeGreaterThan(0);
        expect(product.supplierPriceCents).toBeGreaterThan(0);
        expect(product.options).toHaveLength(1);
        expect(product.options[0]?.values).toHaveLength(3);
        expect(product.variants).toHaveLength(3);
        expect(product.variants.map(variant => variant.label)).toEqual(product.options[0]?.values);
        expect(product.variants.every(variant => variant.stock > 0 && variant.sku.startsWith("DEMO-"))).toBe(true);
      }
    }
  });

  it("marque explicitement la source comme fictive et non exploitable", () => {
    expect(giftDemoLibraryInternalSupplier.name).toBe("Fournisseur démo");
    expect(giftDemoLibraryInternalSupplier.url).toBe("https://example.invalid/demo");
  });

  it("associe seulement un brouillon compatible au kit correspondant", () => {
    expect(getGiftDemoLibraryKit("beauty")?.label).toBe("Beauté & bien-être");
    expect(getGiftDemoLibraryKitForDraft({ businessType: "autre", factoryModel: "beauty" })?.id).toBe("beauty");
    expect(getGiftDemoLibraryKitForDraft({ businessType: "vetements", factoryModel: "fashion" })?.id).toBe("fashion");
    expect(getGiftDemoLibraryKitForDraft({ businessType: "autre", factoryModel: "home" })?.id).toBe("home");
    expect(getGiftDemoLibraryKitForDraft({ businessType: "animalier", factoryModel: "pet" })?.id).toBe("pet");
    expect(getGiftDemoLibraryKitForDraft({ businessType: "autre", factoryModel: "blank" })).toBeUndefined();
  });
});
