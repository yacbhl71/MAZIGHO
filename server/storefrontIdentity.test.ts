import { describe, expect, it } from "vitest";
import { getStorefrontBrandName, withStorefrontBrand } from "../client/src/lib/storefrontIdentity";

describe("storefront identity helper", () => {
  it("uses the store brand when it is available and preserves the platform fallback", () => {
    expect(getStorefrontBrandName({ brandName: "  Dyama  " } as any)).toBe("Dyama");
    expect(getStorefrontBrandName({ brandName: "" } as any)).toBe("MAZIGHO");
  });

  it("replaces platform customer copy through nested locale objects without mutating source values", () => {
    const source = {
      title: "Connexion à MAZIGHO",
      notice: { text: "Bienvenue sur MAZIGHO" },
      items: ["Compte MAZIGHO", "Sans marque imposée"],
    };
    const localized = withStorefrontBrand(source, "Dyama");

    expect(localized).toEqual({
      title: "Connexion à Dyama",
      notice: { text: "Bienvenue sur Dyama" },
      items: ["Compte Dyama", "Sans marque imposée"],
    });
    expect(source.title).toBe("Connexion à MAZIGHO");
  });
});
