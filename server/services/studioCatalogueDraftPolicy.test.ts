import { describe, expect, it } from "vitest";
import { assertStudioCatalogueProductWrite, needsStudioCatalogueActiveCapacity } from "../../shared/studioCatalogueDraftPolicy";

describe("studio catalogue draft policy", () => {
  it("permits a draft with a price to confirm", () => {
    expect(() => assertStudioCatalogueProductWrite({ status: "draft", priceCents: 0 })).not.toThrow();
    expect(needsStudioCatalogueActiveCapacity(null, "draft")).toBe(false);
  });

  it("requires a real price before a product is active", () => {
    expect(() => assertStudioCatalogueProductWrite({ status: "active", priceCents: 0 })).toThrow("CATALOGUE_ACTIVE_PRODUCT_PRICE_REQUIRED");
    expect(() => assertStudioCatalogueProductWrite({ status: "active", priceCents: 1 })).not.toThrow();
  });

  it("counts capacity only when a product becomes active", () => {
    expect(needsStudioCatalogueActiveCapacity("draft", "active")).toBe(true);
    expect(needsStudioCatalogueActiveCapacity("active", "active")).toBe(false);
    expect(needsStudioCatalogueActiveCapacity("active", "draft")).toBe(false);
  });
});
