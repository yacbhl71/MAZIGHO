import { normalizeStoreMarketSettings, type StoreMarketSettings } from "./storeMarketSettings";
import type { StoreCurrencyCode } from "./storeCurrency";

export const storeLaunchMarketIds = ["custom", "switzerland", "portugal", "mexico", "morocco", "algeria"] as const;
export type StoreLaunchMarketId = (typeof storeLaunchMarketIds)[number];

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
 * Operator-selected launch profiles. They only prepare the storefront's visible
 * market and currency reference; they never create a payment account, carrier,
 * tax calculation, legal filing, or external merchant service.
 */
export const storeLaunchMarkets: readonly StoreLaunchMarket[] = [
  {
    id: "custom",
    label: "À définir plus tard",
    shortLabel: "Marché à définir",
    currency: null,
    market: null,
    description: "Aucun marché n’est prérempli : le propriétaire choisira ses pays, langues et devise dans ses réglages.",
  },
  {
    id: "switzerland",
    label: "Suisse · CHF",
    shortLabel: "Suisse · CHF",
    currency: "CHF",
    market: singleMarket({
      primaryLanguage: "fr",
      activeLanguages: ["fr", "de", "it", "en"],
      showLanguageSelector: true,
      primaryCountry: "CH",
      activeCountries: ["CH"],
      showCountrySelector: false,
    }),
    description: "Suisse en CHF, avec français, allemand, italien et anglais disponibles dans la vitrine.",
  },
  {
    id: "portugal",
    label: "Portugal · EUR",
    shortLabel: "Portugal · EUR",
    currency: "EUR",
    market: singleMarket({
      primaryLanguage: "en",
      activeLanguages: ["en"],
      showLanguageSelector: false,
      primaryCountry: "PT",
      activeCountries: ["PT"],
      showCountrySelector: false,
    }),
    description: "Portugal en EUR. L’anglais est prérempli ; les langues disponibles restent modifiables par le propriétaire.",
  },
  {
    id: "mexico",
    label: "Mexique · MXN",
    shortLabel: "Mexique · MXN",
    currency: "MXN",
    market: singleMarket({
      primaryLanguage: "es",
      activeLanguages: ["es"],
      showLanguageSelector: false,
      primaryCountry: "MX",
      activeCountries: ["MX"],
      showCountrySelector: false,
    }),
    description: "Mexique en pesos mexicains, avec une vitrine espagnole préremplie.",
  },
  {
    id: "morocco",
    label: "Maroc · MAD",
    shortLabel: "Maroc · MAD",
    currency: "MAD",
    market: singleMarket({
      primaryLanguage: "fr",
      activeLanguages: ["fr", "ar"],
      showLanguageSelector: true,
      primaryCountry: "MA",
      activeCountries: ["MA"],
      showCountrySelector: false,
    }),
    description: "Maroc en dirhams marocains, avec français et arabe préremplis.",
  },
  {
    id: "algeria",
    label: "Algérie · DZD & livraison",
    shortLabel: "Algérie · DZD",
    currency: "DZD",
    market: singleMarket({
      primaryLanguage: "fr",
      activeLanguages: ["fr", "ar"],
      showLanguageSelector: true,
      primaryCountry: "DZ",
      activeCountries: ["DZ"],
      showCountrySelector: false,
    }),
    description: "Algérie en DZD, avec la préparation locale de livraison et paiement à la livraison à compléter par le propriétaire.",
  },
] as const;

export function isStoreLaunchMarketId(value: unknown): value is StoreLaunchMarketId {
  return typeof value === "string" && (storeLaunchMarketIds as readonly string[]).includes(value);
}

export function normalizeStoreLaunchMarket(value: unknown): StoreLaunchMarketId {
  return isStoreLaunchMarketId(value) ? value : "custom";
}

export function getStoreLaunchMarket(value: unknown): StoreLaunchMarket {
  const id = normalizeStoreLaunchMarket(value);
  return storeLaunchMarkets.find(market => market.id === id) ?? storeLaunchMarkets[0];
}
