import { describe, expect, it } from "vitest";
import { isMissingProductCategoryIdentityError, withExplicitProductCategoryIds } from "../shared/productCategoryIdentity";

describe("product category identity compatibility", () => {
  it("recognises the legacy TiDB identity error only", () => {
    expect(isMissingProductCategoryIdentityError(new Error("Field 'id' doesn't have a default value"))).toBe(true);
    expect(isMissingProductCategoryIdentityError(new Error("Duplicate entry '1' for key 'PRIMARY'"))).toBe(false);
  });

  it("recognises the TiDB identity error when Drizzle wraps it", () => {
    const tidbError = Object.assign(new Error("Field 'id' doesn't have a default value"), {
      sqlMessage: "Field 'id' doesn't have a default value",
    });
    const drizzleError = Object.assign(new Error("Failed query: insert into `productCategories`"), {
      cause: tidbError,
    });

    expect(isMissingProductCategoryIdentityError(drizzleError)).toBe(true);
  });

  it("creates deterministic explicit ids only for a bounded fallback", () => {
    expect(withExplicitProductCategoryIds([
      { storeId: 81, productId: 3150009, categoryId: 810003 },
      { storeId: 81, productId: 3150009, categoryId: 210003 },
    ], 92)).toEqual([
      { id: 93, storeId: 81, productId: 3150009, categoryId: 810003 },
      { id: 94, storeId: 81, productId: 3150009, categoryId: 210003 },
    ]);
  });
});
