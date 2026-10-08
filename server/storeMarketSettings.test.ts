import { describe, expect, it } from "vitest";
import { DEFAULT_STORE_MARKET_SETTINGS, getStorefrontCountryLabel, normalizeStoreMarketSettings, parseStoreMarketSettings, storefrontCountryCodes } from "../shared/storeMarketSettings";

describe("store market settings", () => {
  it("keeps the legacy storefront configuration as a safe default", () => {
    expect(parseStoreMarketSettings(null)).toEqual(DEFAULT_STORE_MARKET_SETTINGS);
  });

  it("supports a single-market storefront without visible selectors", () => {
    expect(normalizeStoreMarketSettings({
      primaryLanguage: "fr",
      activeLanguages: ["fr"],
      showLanguageSelector: true,
      primaryCountry: "DZ",
      activeCountries: ["DZ"],
      showCountrySelector: true,
    })).toEqual({
      primaryLanguage: "fr",
      activeLanguages: ["fr"],
      showLanguageSelector: false,
      primaryCountry: "DZ",
      activeCountries: ["DZ"],
      showCountrySelector: false,
    });
  });

  it("keeps a Swiss French single-market shop free of public selectors", () => {
    expect(normalizeStoreMarketSettings({
      primaryLanguage: "fr",
      activeLanguages: ["fr"],
      showLanguageSelector: false,
      primaryCountry: "CH",
      activeCountries: ["CH"],
      showCountrySelector: false,
    })).toEqual({
      primaryLanguage: "fr",
      activeLanguages: ["fr"],
      showLanguageSelector: false,
      primaryCountry: "CH",
      activeCountries: ["CH"],
      showCountrySelector: false,
    });
  });

  it("normalizes valid multilingual and multi-country choices without duplicates", () => {
    expect(normalizeStoreMarketSettings({
      primaryLanguage: "ar",
      activeLanguages: ["ar", "fr", "en", "fr"],
      showLanguageSelector: true,
      primaryCountry: "DZ",
      activeCountries: ["DZ", "FR", "DZ"],
      showCountrySelector: true,
    })).toEqual({
      primaryLanguage: "ar",
      activeLanguages: ["ar", "fr", "en"],
      showLanguageSelector: true,
      primaryCountry: "DZ",
      activeCountries: ["DZ", "FR"],
      showCountrySelector: true,
    });
  });

  it("falls back to an active primary selection when an input is malformed", () => {
    expect(normalizeStoreMarketSettings({
      primaryLanguage: "fr",
      activeLanguages: ["de"],
      primaryCountry: "CH",
      activeCountries: ["FR"],
    } as any)).toMatchObject({ primaryLanguage: "de", activeLanguages: ["de"], primaryCountry: "FR", activeCountries: ["FR"] });
  });

  it("accepts the full ISO country catalogue and presents localized labels", () => {
    expect(storefrontCountryCodes).toHaveLength(249);
    expect(storefrontCountryCodes).toEqual(expect.arrayContaining(["CH", "DZ", "MA", "MX", "PT", "JP", "ZA"]));
    expect(getStorefrontCountryLabel("JP")).toBe("Japon");
    expect(normalizeStoreMarketSettings({
      primaryLanguage: "en",
      activeLanguages: ["en"],
      primaryCountry: "JP",
      activeCountries: ["JP", "ZA"],
    })).toMatchObject({ primaryCountry: "JP", activeCountries: ["JP", "ZA"] });
  });
});
