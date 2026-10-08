import { getStorefrontCountryLabel, normalizeStoreMarketSettings, storefrontCountryCodes, type StorefrontCountryCode, type StoreMarketSettings } from "./storeMarketSettings";
import type { StoreCurrencyCode } from "./storeCurrency";

export const storeLaunchMarketIds = ["custom", "switzerland", "portugal", "mexico", "morocco", "algeria"] as const;
type StoreLaunchMarketPresetId = (typeof storeLaunchMarketIds)[number];
export type StoreLaunchMarketId = StoreLaunchMarketPresetId | `country:${StorefrontCountryCode}`;

export type StoreLaunchMarket = {
  id: StoreLaunchMarketId;
  label: string;
  shortLabel: string;
  currency: StoreCurrencyCode | null;
  market: StoreMarketSettings | null;
  description: string;
};

const singleMarket = (input: Parameters<typeof normalizeStoreMarketSettings>[0]) => normalizeStoreMarketSettings(input);

/**
 * Operator-selected launch profiles. They prepare only the visible storefront
 * market and currency reference; they never create a payment account, carrier,
 * tax calculation, legal filing, or external merchant service.
 */
export const storeLaunchMarkets: readonly StoreLaunchMarket[] = [
  { id: "custom", label: "À définir plus tard", shortLabel: "Marché à définir", currency: null, market: null, description: "Aucun marché n’est prérempli : le propriétaire choisira ses pays, langues et devise dans ses réglages." },
  { id: "switzerland", label: "Suisse · CHF", shortLabel: "Suisse · CHF", currency: "CHF", market: singleMarket({ primaryLanguage: "fr", activeLanguages: ["fr", "de", "it", "en"], showLanguageSelector: true, primaryCountry: "CH", activeCountries: ["CH"], showCountrySelector: false }), description: "Suisse en CHF, avec français, allemand, italien et anglais disponibles dans la vitrine." },
  { id: "portugal", label: "Portugal · EUR", shortLabel: "Portugal · EUR", currency: "EUR", market: singleMarket({ primaryLanguage: "en", activeLanguages: ["en"], showLanguageSelector: false, primaryCountry: "PT", activeCountries: ["PT"], showCountrySelector: false }), description: "Portugal en EUR. L’anglais est prérempli ; les langues disponibles restent modifiables par le propriétaire." },
  { id: "mexico", label: "Mexique · MXN", shortLabel: "Mexique · MXN", currency: "MXN", market: singleMarket({ primaryLanguage: "es", activeLanguages: ["es"], showLanguageSelector: false, primaryCountry: "MX", activeCountries: ["MX"], showCountrySelector: false }), description: "Mexique en pesos mexicains, avec une vitrine espagnole préremplie." },
  { id: "morocco", label: "Maroc · MAD", shortLabel: "Maroc · MAD", currency: "MAD", market: singleMarket({ primaryLanguage: "fr", activeLanguages: ["fr", "ar"], showLanguageSelector: true, primaryCountry: "MA", activeCountries: ["MA"], showCountrySelector: false }), description: "Maroc en dirhams marocains, avec français et arabe préremplis." },
  { id: "algeria", label: "Algérie · DZD & livraison", shortLabel: "Algérie · DZD", currency: "DZD", market: singleMarket({ primaryLanguage: "fr", activeLanguages: ["fr", "ar"], showLanguageSelector: true, primaryCountry: "DZ", activeCountries: ["DZ"], showCountrySelector: false }), description: "Algérie en DZD, avec la préparation locale de livraison et paiement à la livraison à compléter par le propriétaire." },
] as const;

export function isStoreLaunchMarketId(value: unknown): value is StoreLaunchMarketId {
  if (typeof value !== "string") return false;
  if ((storeLaunchMarketIds as readonly string[]).includes(value)) return true;
  const match = /^country:([A-Z]{2})$/.exec(value);
  return Boolean(match && storefrontCountryCodes.includes(match[1] as StorefrontCountryCode));
}

export function normalizeStoreLaunchMarket(value: unknown): StoreLaunchMarketId {
  return isStoreLaunchMarketId(value) ? value : "custom";
}

function getCountryLaunchMarket(countryCode: StorefrontCountryCode): StoreLaunchMarket {
  const label = getStorefrontCountryLabel(countryCode);
  return {
    id: `country:${countryCode}`,
    label,
    shortLabel: label,
    currency: null,
    market: singleMarket({ primaryLanguage: "en", activeLanguages: ["en"], showLanguageSelector: false, primaryCountry: countryCode, activeCountries: [countryCode], showCountrySelector: false }),
    description: `${label} prérempli comme marché unique. La devise, les langues, la livraison, les taxes et le paiement restent à définir par le propriétaire.`,
  };
}

export function getStoreLaunchMarket(value: unknown): StoreLaunchMarket {
  const id = normalizeStoreLaunchMarket(value);
  if (id.startsWith("country:")) return getCountryLaunchMarket(id.slice("country:".length) as StorefrontCountryCode);
  return storeLaunchMarkets.find(market => market.id === id) ?? storeLaunchMarkets[0];
}
