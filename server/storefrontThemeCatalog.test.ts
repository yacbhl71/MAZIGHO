import { describe, expect, it } from "vitest";
import { storefrontThemeCatalog, storefrontThemeIds, storefrontThemeLabels } from "../shared/storefrontThemeCatalog";

describe("shared storefront theme catalog", () => {
  it("exposes thirteen unique owner-selectable theme identifiers", () => {
    expect(storefrontThemeIds).toHaveLength(13);
    expect(new Set(storefrontThemeIds).size).toBe(13);
    expect(storefrontThemeCatalog.map(theme => theme.id)).toEqual(storefrontThemeIds);
    expect(storefrontThemeIds).toEqual(expect.arrayContaining(["gallerySignature", "studioFlux", "glamourNoir"]));
  });

  it("provides complete visual presentation metadata for every theme", () => {
    for (const theme of storefrontThemeCatalog) {
      expect(theme.label).toBe(storefrontThemeLabels[theme.id]);
      expect(theme.visual).toMatch(/^\/assets\//);
      expect(theme.visualAlt.length).toBeGreaterThan(8);
      expect(theme.benefits).toHaveLength(3);
      expect(theme.palette.button).toContain("bg-");
    }
  });
});
