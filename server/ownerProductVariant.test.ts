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
      priceAdjustmentCents: 250,
      stock: 6,
      status: "active",
    })).toEqual({ label: "Bleu · M", sku: "TSHIRT-BLU-M", priceAdjustmentCents: 250, stock: 6, status: "active" });
  });

  it("rejects unsafe stock and price values", () => {
    expect(normalizeOwnerProductVariantDraft({ label: "Test", priceAdjustmentCents: 0, stock: -1, status: "active" })).toBeNull();
    expect(normalizeOwnerProductVariantDraft({ label: "Test", priceAdjustmentCents: 10_000_001, stock: 1, status: "active" })).toBeNull();
  });
});
