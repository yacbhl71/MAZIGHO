import { describe, expect, it } from "vitest";
import { normalizeStudioProductDrafts } from "./storeProductDraft";

const collections = [{ id: "walks", title: "Promenade" }];

describe("normalizeStudioProductDrafts", () => {
  it("retains only the closed preparation product contract", () => {
    const result = normalizeStudioProductDrafts([
      {
        id: "external-id",
        name: "Laisse urbaine",
        description: "Une laisse sobre et résistante imaginée pour les promenades quotidiennes.",
        collectionId: "walks",
        priceCents: 2490,
        featured: true,
        supplier: "external-supplier",
        stock: 99,
        sku: "LEASH-01",
        checkoutUrl: "https://example.invalid/checkout",
      },
    ], collections);

    expect(result).toEqual([
      {
        id: "product-1",
        name: "Laisse urbaine",
        description: "Une laisse sobre et résistante imaginée pour les promenades quotidiennes.",
        collectionId: "walks",
        priceCents: 2490,
        featured: true,
      },
    ]);
  });

  it("accepts an empty product list and removes malformed product values", () => {
    expect(normalizeStudioProductDrafts([], collections)).toEqual([]);
    expect(normalizeStudioProductDrafts([{ id: "x", name: "", description: "a", collectionId: "walks", priceCents: 0, featured: false }], collections)).toEqual([]);
  });
});
