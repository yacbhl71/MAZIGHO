import { describe, expect, it } from "vitest";
import {
  isProductPurchasableForStorefront,
  isProductVisibleForStorefront,
} from "../shared/storefrontProductVisibility";

describe("storefront product visibility", () => {
  it("shows products with a confirmed profile for the selected country", () => {
    expect(isProductVisibleForStorefront([{ countryCode: "CH" }], "CH", false)).toBe(true);
  });

  it("keeps supplier products with a delivery profile for another country hidden", () => {
    expect(isProductVisibleForStorefront([{ countryCode: "FR" }], "CH", true, false)).toBe(false);
  });

  it("allows a client boutique to show and sell a manually stocked product everywhere", () => {
    expect(isProductVisibleForStorefront([], "CH", true, true)).toBe(true);
    expect(isProductVisibleForStorefront(undefined, "DZ", true, true)).toBe(true);
    expect(isProductPurchasableForStorefront([], "FR", true, true)).toBe(true);
  });

  it("does not relax delivery visibility for supplier products or the platform storefront", () => {
    expect(isProductVisibleForStorefront([], "CH", true, false)).toBe(false);
    expect(isProductVisibleForStorefront([], "CH", false, true)).toBe(false);
  });
});
