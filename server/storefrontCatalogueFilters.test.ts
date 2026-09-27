import { describe, expect, it } from "vitest";
import { productMatchesCatalogueFilters } from "../client/src/components/StorefrontCatalogueFilters";

const base = {
  categoryId: "all",
  availableOnly: true,
  priceRange: [0, 10_000] as [number, number],
  selectedOptions: {},
};

describe("storefront catalogue filters", () => {
  const product = { id: 1, categoryId: 3, categoryIds: [3, 5], price: 2_500, stock: 4, options: { Taille: ["S", "M"], Couleur: "Violet" } };

  it("filters by category, live stock and price without depending on display copy", () => {
    expect(productMatchesCatalogueFilters(product, base)).toBe(true);
    expect(productMatchesCatalogueFilters(product, { ...base, categoryId: "5" })).toBe(true);
    expect(productMatchesCatalogueFilters({ ...product, stock: 0 }, base)).toBe(false);
    expect(productMatchesCatalogueFilters(product, { ...base, priceRange: [0, 2_000] })).toBe(false);
  });

  it("filters dynamic product attributes whether options are persisted as JSON or objects", () => {
    expect(productMatchesCatalogueFilters(product, { ...base, selectedOptions: { Taille: ["M"] } })).toBe(true);
    expect(productMatchesCatalogueFilters(product, { ...base, selectedOptions: { Couleur: ["Fuchsia"] } })).toBe(false);
    expect(productMatchesCatalogueFilters({ ...product, options: '{"Taille":["L"],"Thème":"Floral"}' }, { ...base, selectedOptions: { "Thème": ["Floral"] } })).toBe(true);
  });
});
