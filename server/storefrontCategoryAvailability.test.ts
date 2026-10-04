import { describe, expect, it } from "vitest";
import { getStorefrontCategoryAvailability } from "../shared/storefrontCategoryAvailability";

describe("storefront category availability", () => {
  it("marks a category with no assigned products as empty rather than blaming delivery", () => {
    expect(getStorefrontCategoryAvailability({ totalProducts: 0, visibleProducts: 0 })).toBe("empty");
  });

  it("keeps a destination-specific warning only for products hidden by that destination", () => {
    expect(getStorefrontCategoryAvailability({ totalProducts: 3, visibleProducts: 0 })).toBe("delivery_unavailable");
  });

  it("recognises an available selection", () => {
    expect(getStorefrontCategoryAvailability({ totalProducts: 3, visibleProducts: 2 })).toBe("available");
  });
});
