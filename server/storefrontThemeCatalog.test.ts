import { describe, expect, it } from "vitest";
import { isPremiumStorefrontTheme, premiumStorefrontThemeIds, storefrontThemeCatalog, storefrontThemeIds, storefrontThemeLabels } from "../shared/storefrontThemeCatalog";

describe("shared storefront theme catalog", () => {
  it("exposes fourteen unique owner-selectable theme identifiers", () => {
    expect(storefrontThemeIds).toHaveLength(14);
    expect(new Set(storefrontThemeIds).size).toBe(14);
    expect(storefrontThemeCatalog.map(theme => theme.id)).toEqual(storefrontThemeIds);
    expect(storefrontThemeIds).toEqual(expect.arrayContaining(["marketExpress", "gallerySignature", "studioFlux", "glamourNoir"]));
  });

  it("marks the curated premium themes without removing them from the preview catalog", () => {
    expect(premiumStorefrontThemeIds).toEqual(["gallerySignature", "studioFlux", "glamourNoir"]);
    expect(premiumStorefrontThemeIds.every(themeId => storefrontThemeIds.includes(themeId))).toBe(true);
    expect(isPremiumStorefrontTheme("glamourNoir")).toBe(true);
    expect(isPremiumStorefrontTheme("coffee")).toBe(false);
  });

  it("provides complete visual presentation metadata for every theme", () => {
    for (const theme of storefrontThemeCatalog) {
      expect(theme.label).toBe(storefrontThemeLabels[theme.id]);
      expect(theme.visual).toMatch(/^(?:\/assets\/|https:\/\/files\.manuscdn\.com\/)/);
      expect(theme.visualAlt.length).toBeGreaterThan(8);
      expect(theme.benefits).toHaveLength(3);
      expect(theme.palette.button).toContain("bg-");
    }
  });
});
