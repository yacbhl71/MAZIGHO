import { describe, expect, it } from "vitest";
import { normalizeStoreProductBundles, orderBundleProducts, parseStoreProductBundles } from "../shared/storeProductBundles";

describe("store product bundle contract", () => {
  it("keeps only valid unique duo or trio selections", () => {
    expect(normalizeStoreProductBundles([
      { id: "bundle_good-id1", name: "Duo créatif", description: "  Deux  produits ", productIds: [4, 9, 9], promoCode: " duo10 ", enabled: true },
      { id: "bundle_bad", name: "Seul", productIds: [4], enabled: true },
      { id: "bundle_good-id1", name: "Duplicat", productIds: [2, 3], enabled: false },
    ])).toEqual([{ id: "bundle_good-id1", name: "Duo créatif", description: "Deux produits", productIds: [4, 9], promoCode: "DUO10", enabled: true }]);
  });

  it("fails closed on malformed stored content", () => {
    expect(parseStoreProductBundles("{not-json")).toEqual([]);
  });

  it("preserves owner selection order and drops stale products", () => {
    expect(orderBundleProducts({ productIds: [9, 3, 5] }, [{ id: 3, name: "Trois" }, { id: 9, name: "Neuf" }])).toEqual([
      { id: 9, name: "Neuf" },
      { id: 3, name: "Trois" },
    ]);
  });
});
