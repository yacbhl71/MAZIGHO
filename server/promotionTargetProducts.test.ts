import { describe, expect, it } from "vitest";
import { getPromotionTargetProductsSubtotal, normalizePromotionTargetProductIds, parsePromotionTargetProductIds } from "../shared/promotionTargetProducts";

describe("promotion target products", () => {
  it("normalizes unique positive product IDs and fails closed on malformed storage", () => {
    expect(normalizePromotionTargetProductIds([4, "9", 4, 0, -2, "invalid"])).toEqual([4, 9]);
    expect(parsePromotionTargetProductIds("[9, 4, 9]")).toEqual([9, 4]);
    expect(parsePromotionTargetProductIds("not-json")).toEqual([]);
  });

  it("calculates a discount base from targeted lines only", () => {
    const items = [
      { productId: 4, price: 1290, quantity: 2 },
      { productId: 9, price: 850, quantity: 1 },
      { productId: 12, price: 500, quantity: 3 },
    ];
    expect(getPromotionTargetProductsSubtotal(items, [9, 4])).toBe(3430);
    expect(getPromotionTargetProductsSubtotal(items, [77])).toBe(0);
  });

  it("does not trust invalid prices or quantities from a caller", () => {
    expect(getPromotionTargetProductsSubtotal([
      { productId: 4, price: 500, quantity: 0 },
      { productId: 4, price: -10, quantity: 2 },
      { productId: 4, price: 500, quantity: 2 },
    ], [4])).toBe(1000);
  });
});
