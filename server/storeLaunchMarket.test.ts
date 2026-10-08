import { describe, expect, it } from "vitest";
import { getStoreLaunchMarket, isStoreLaunchMarketId, normalizeStoreLaunchMarket, storeLaunchMarketIds } from "../shared/storeLaunchMarket";

describe("Studio launch market profiles", () => {
  it("keeps the operator-selected launch profiles strictly within supported storefront markets", () => {
    expect(storeLaunchMarketIds).toEqual(["custom", "switzerland", "portugal", "mexico", "morocco", "algeria"]);
    expect(getStoreLaunchMarket("portugal")).toMatchObject({
      currency: "EUR",
      market: { primaryCountry: "PT", activeCountries: ["PT"], activeLanguages: ["en"] },
    });
    expect(getStoreLaunchMarket("mexico")).toMatchObject({
      currency: "MXN",
      market: { primaryCountry: "MX", activeCountries: ["MX"], activeLanguages: ["es"] },
    });
    expect(getStoreLaunchMarket("morocco")).toMatchObject({
      currency: "MAD",
      market: { primaryCountry: "MA", activeCountries: ["MA"], activeLanguages: ["fr", "ar"] },
    });
  });

  it("falls back to a manual profile for unknown values and never infers payment or legal settings", () => {
    expect(normalizeStoreLaunchMarket("unknown")).toBe("custom");
    expect(getStoreLaunchMarket("unknown")).toMatchObject({
      id: "custom",
      currency: null,
      market: null,
    });
  });

  it("accepts a generic ISO country without introducing a profile per country", () => {
    expect(isStoreLaunchMarketId("country:JP")).toBe(true);
    expect(isStoreLaunchMarketId("country:XX")).toBe(false);
    expect(getStoreLaunchMarket("country:JP")).toMatchObject({
      id: "country:JP",
      currency: null,
      market: { primaryCountry: "JP", activeCountries: ["JP"], activeLanguages: ["en"] },
    });
  });
});
