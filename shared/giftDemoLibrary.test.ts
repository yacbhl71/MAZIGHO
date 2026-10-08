import { describe, expect, it } from "vitest";
import { giftDemoLibraryKitIds, giftDemoLibraryKits, getGiftDemoLibraryKit, getGiftDemoLibraryKitForDraft } from "./giftDemoLibrary";

describe("gift demo library", () => {
  it("expose six kits non commerciaux, chacun avec une structure de trois catégories", () => {
    expect(giftDemoLibraryKits.map(kit => kit.id)).toEqual(giftDemoLibraryKitIds);
    expect(new Set(giftDemoLibraryKits.map(kit => kit.setupKey)).size).toBe(giftDemoLibraryKits.length);

    for (const kit of giftDemoLibraryKits) {
      expect(kit.categories).toHaveLength(3);
      expect(kit.categories.map(category => category.slug)).toContain(kit.product.categorySlug);
      expect(kit.product.name).toMatch(/^Fiche de démonstration/);
      expect(kit.product.description).toBe("Fiche non commerciale à remplacer avant toute vente.");
      expect(Object.keys(kit.product)).not.toEqual(expect.arrayContaining(["price", "stock", "imageUrl", "supplier", "payment"]));
    }
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
