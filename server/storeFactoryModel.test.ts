import { describe, expect, it } from "vitest";
import {
  getStoreFactoryModel,
  getStoreFactoryStarterCategories,
  normalizeStoreFactoryModelId,
  storeFactoryModels,
} from "../shared/storeFactoryModel";

describe("store factory models", () => {
  it("falls back to the deliberately empty model for unknown values", () => {
    expect(normalizeStoreFactoryModelId("unknown-model")).toBe("blank");
    expect(getStoreFactoryModel(undefined).id).toBe("blank");
    expect(getStoreFactoryStarterCategories("unknown-model")).toEqual([]);
  });

  it("contains only empty category structures, never commercial catalogue data", () => {
    for (const model of storeFactoryModels) {
      for (const category of model.categories) {
        expect(category.name.trim().length).toBeGreaterThan(1);
        expect(category.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(category.displayOrder).toBeGreaterThan(0);
        expect(category).not.toHaveProperty("price");
        expect(category).not.toHaveProperty("stock");
        expect(category).not.toHaveProperty("imageUrl");
      }
    }
  });

  it("returns fresh category values for each boutique", () => {
    const first = getStoreFactoryStarterCategories("fashion");
    const second = getStoreFactoryStarterCategories("fashion");
    expect(first).toHaveLength(3);
    expect(second).toHaveLength(3);
    first[0].name = "Modified only locally";
    expect(second[0].name).toBe("Femme");
  });

  it("provides a local market structure without adding products or commercial data", () => {
    const model = getStoreFactoryModel("local_market");
    const categories = getStoreFactoryStarterCategories("local_market");

    expect(model).toMatchObject({
      label: "Épicerie & livraison locale",
      suggestedTheme: "marketExpress",
      customBusinessTheme: "Épicerie, produits frais et livraison locale",
    });
    expect(categories.map(category => category.name)).toEqual([
      "Fruits & légumes",
      "Épicerie & boissons",
      "Frais, boucherie & poissonnerie",
      "Pizza & traiteur",
      "Maison & hygiène",
    ]);
  });
});
