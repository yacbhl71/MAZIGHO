export const storefrontLanguageCodes = ["fr", "de", "it", "en", "es", "nl", "ar"] as const;
export type StorefrontLanguageCode = (typeof storefrontLanguageCodes)[number];

export const storefrontCountryCodes = ["CH", "FR", "DE", "IT", "AT", "BE", "NL", "ES", "DZ"] as const;
export type StorefrontCountryCode = (typeof storefrontCountryCodes)[number];

export const storefrontLanguageChoices: Array<{ code: StorefrontLanguageCode; label: string; nativeLabel: string }> = [
  { code: "fr", label: "Français", nativeLabel: "Français" },
  { code: "de", label: "Allemand", nativeLabel: "Deutsch" },
  { code: "it", label: "Italien", nativeLabel: "Italiano" },
  { code: "en", label: "Anglais", nativeLabel: "English" },
  { code: "es", label: "Espagnol", nativeLabel: "Español" },
  { code: "nl", label: "Néerlandais", nativeLabel: "Nederlands" },
  { code: "ar", label: "Arabe", nativeLabel: "العربية" },
];

export const storefrontCountryChoices: Array<{ code: StorefrontCountryCode; label: string }> = [
  { code: "CH", label: "Suisse" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Allemagne" },
  { code: "IT", label: "Italie" },
  { code: "AT", label: "Autriche" },
  { code: "BE", label: "Belgique" },
  { code: "NL", label: "Pays-Bas" },
  { code: "ES", label: "Espagne" },
  { code: "DZ", label: "Algérie" },
];

export type StoreMarketSettings = {
  primaryLanguage: StorefrontLanguageCode;
  activeLanguages: StorefrontLanguageCode[];
  showLanguageSelector: boolean;
  primaryCountry: StorefrontCountryCode;
  activeCountries: StorefrontCountryCode[];
  showCountrySelector: boolean;
};

export const DEFAULT_STORE_MARKET_SETTINGS: StoreMarketSettings = {
  // Existing boutiques retain the current broad storefront experience until an
  // owner deliberately narrows its public markets.
  primaryLanguage: "fr",
  activeLanguages: [...storefrontLanguageCodes],
  showLanguageSelector: true,
  primaryCountry: "CH",
  activeCountries: storefrontCountryCodes.filter(code => code !== "DZ"),
  showCountrySelector: true,
};

function isLanguage(value: unknown): value is StorefrontLanguageCode {
  return typeof value === "string" && storefrontLanguageCodes.includes(value as StorefrontLanguageCode);
}

function isCountry(value: unknown): value is StorefrontCountryCode {
  return typeof value === "string" && storefrontCountryCodes.includes(value as StorefrontCountryCode);
}

function normalizeLanguages(value: unknown): StorefrontLanguageCode[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(isLanguage))).slice(0, storefrontLanguageCodes.length);
}

function normalizeCountries(value: unknown): StorefrontCountryCode[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(isCountry))).slice(0, storefrontCountryCodes.length);
}

/** Keeps a market profile valid even when legacy or manually edited settings are malformed. */
export function normalizeStoreMarketSettings(input: Partial<StoreMarketSettings>): StoreMarketSettings {
  const initialLanguage = isLanguage(input.primaryLanguage) ? input.primaryLanguage : DEFAULT_STORE_MARKET_SETTINGS.primaryLanguage;
  const requestedLanguages = normalizeLanguages(input.activeLanguages);
  const activeLanguages = requestedLanguages.length > 0 ? requestedLanguages : [initialLanguage];
  const primaryLanguage = activeLanguages.includes(initialLanguage) ? initialLanguage : activeLanguages[0];

  const initialCountry = isCountry(input.primaryCountry) ? input.primaryCountry : DEFAULT_STORE_MARKET_SETTINGS.primaryCountry;
  const requestedCountries = normalizeCountries(input.activeCountries);
  const activeCountries = requestedCountries.length > 0 ? requestedCountries : [initialCountry];
  const primaryCountry = activeCountries.includes(initialCountry) ? initialCountry : activeCountries[0];

  return {
    primaryLanguage,
    activeLanguages,
    showLanguageSelector: input.showLanguageSelector === true && activeLanguages.length > 1,
    primaryCountry,
    activeCountries,
    showCountrySelector: input.showCountrySelector === true && activeCountries.length > 1,
  };
}

export function parseStoreMarketSettings(value: string | null | undefined): StoreMarketSettings {
  if (!value) return { ...DEFAULT_STORE_MARKET_SETTINGS, activeLanguages: [...DEFAULT_STORE_MARKET_SETTINGS.activeLanguages], activeCountries: [...DEFAULT_STORE_MARKET_SETTINGS.activeCountries] };
  try {
    const parsed = JSON.parse(value) as Partial<StoreMarketSettings>;
    if (!parsed || typeof parsed !== "object") throw new Error("invalid profile");
    return normalizeStoreMarketSettings(parsed);
  } catch {
    return { ...DEFAULT_STORE_MARKET_SETTINGS, activeLanguages: [...DEFAULT_STORE_MARKET_SETTINGS.activeLanguages], activeCountries: [...DEFAULT_STORE_MARKET_SETTINGS.activeCountries] };
  }
}

export function hasVisibleLanguageSelector(settings: StoreMarketSettings) {
  return settings.showLanguageSelector && settings.activeLanguages.length > 1;
}

export function hasVisibleCountrySelector(settings: StoreMarketSettings) {
  return settings.showCountrySelector && settings.activeCountries.length > 1;
}
