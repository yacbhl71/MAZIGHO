import { describe, expect, it } from "vitest";
import { getProductDiscountPercentage, hasProductPromotion } from "../shared/productPromotion";

describe("product promotions", () => {
  it("calculates a valid displayed discount", () => {
    expect(getProductDiscountPercentage(1090, 1490)).toBe(27);
    expect(hasProductPromotion(1090, 1490)).toBe(true);
  });

  it("rejects crossed-out prices that do not exceed the sale price", () => {
    expect(getProductDiscountPercentage(1090, 1090)).toBeNull();
    expect(getProductDiscountPercentage(1090, 990)).toBeNull();
    expect(hasProductPromotion(1090, null)).toBe(false);
  });
});
