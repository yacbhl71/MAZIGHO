import { describe, expect, it } from "vitest";
import { isProductVisibleForStorefront } from "../shared/storefrontProductVisibility";

describe("storefront product visibility", () => {
  it("shows products with a confirmed profile for the selected country", () => {
    expect(isProductVisibleForStorefront([{ countryCode: "CH" }], "CH", false)).toBe(true);
  });

  it("keeps products with a delivery profile for another country hidden", () => {
    expect(isProductVisibleForStorefront([{ countryCode: "FR" }], "CH", true)).toBe(false);
  });

  it("allows client storefronts to preview manual products without a profile", () => {
    expect(isProductVisibleForStorefront([], "CH", true)).toBe(true);
    expect(isProductVisibleForStorefront(undefined, "CH", true)).toBe(true);
  });

  it("does not relax delivery visibility for the platform storefront", () => {
    expect(isProductVisibleForStorefront([], "CH", false)).toBe(false);
  });
});
