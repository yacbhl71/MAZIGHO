import { describe, expect, it } from "vitest";
import { getOwnerProductVariantStockState, normalizeOwnerProductVariantDraft } from "../shared/ownerProductVariant";

describe("owner product variants", () => {
  it("classifies active stock with the configured low-stock threshold", () => {
    expect(getOwnerProductVariantStockState({ stock: 8, status: "active" }, 5)).toBe("available");
    expect(getOwnerProductVariantStockState({ stock: 5, status: "active" }, 5)).toBe("low");
    expect(getOwnerProductVariantStockState({ stock: 0, status: "active" }, 5)).toBe("out");
    expect(getOwnerProductVariantStockState({ stock: 99, status: "inactive" }, 5)).toBe("inactive");
  });

  it("normalizes a valid independent variant without supplier data", () => {
    expect(normalizeOwnerProductVariantDraft({
      label: "Bleu · M",
      sku: "  TSHIRT-BLU-M  ",
      imageUrl: " https://cdn.example.test/bleu-m.webp ",
      priceAdjustmentCents: 250,
      stock: 6,
      status: "active",
    })).toEqual({ label: "Bleu · M", sku: "TSHIRT-BLU-M", imageUrl: "https://cdn.example.test/bleu-m.webp", priceAdjustmentCents: 250, stock: 6, status: "active" });
  });

  it("rejects unsafe stock and price values", () => {
    expect(normalizeOwnerProductVariantDraft({ label: "Test", priceAdjustmentCents: 0, stock: -1, status: "active" })).toBeNull();
    expect(normalizeOwnerProductVariantDraft({ label: "Test", priceAdjustmentCents: 10_000_001, stock: 1, status: "active" })).toBeNull();
  });

  it("accepts only HTTPS or internal media URLs for a variant image", () => {
    expect(normalizeOwnerProductVariantDraft({ label: "Boîte", imageUrl: "/api/files/boite.webp", priceAdjustmentCents: 0, stock: 1, status: "active" })?.imageUrl).toBe("/api/files/boite.webp");
    expect(normalizeOwnerProductVariantDraft({ label: "Boîte", imageUrl: "http://unsafe.example/boite.webp", priceAdjustmentCents: 0, stock: 1, status: "active" })).toBeNull();
  });
});
