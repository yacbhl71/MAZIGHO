export const storefrontLanguageCodes = ["fr", "de", "it", "en", "es", "nl", "ar"] as const;
export type StorefrontLanguageCode = (typeof storefrontLanguageCodes)[number];

/** ISO 3166-1 alpha-2 countries. The operator may choose any country without
 * implying availability of Stripe, a carrier, taxes or a legal framework. */
export const storefrontCountryCodes = ['AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'] as const;
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

/** Uses the browser/Node internationalisation catalogue when available. */
export function getStorefrontCountryLabel(code: StorefrontCountryCode | string, locale = "fr") {
  const normalized = code.trim().toUpperCase();
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(normalized) || normalized;
  } catch {
    return normalized;
  }
}

export const storefrontCountryChoices: Array<{ code: StorefrontCountryCode; label: string }> = storefrontCountryCodes
  .map(code => ({ code, label: getStorefrontCountryLabel(code) }))
  .sort((left, right) => left.label.localeCompare(right.label, "fr"));

export type StoreMarketSettings = {
  primaryLanguage: StorefrontLanguageCode;
  activeLanguages: StorefrontLanguageCode[];
  showLanguageSelector: boolean;
  primaryCountry: StorefrontCountryCode;
  activeCountries: StorefrontCountryCode[];
  showCountrySelector: boolean;
};

export const DEFAULT_STORE_MARKET_SETTINGS: StoreMarketSettings = {
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
    if (!parsed || typeof parsed !== "object") throw new Error("invalid");
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
