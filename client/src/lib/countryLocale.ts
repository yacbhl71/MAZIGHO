import type { StorefrontLocale } from "@/contexts/LocaleContext";
import { getStorefrontCountryLabel } from "@shared/storeMarketSettings";

export function getLocalizedCountryName(countryCode: string, locale: StorefrontLocale) {
  return getStorefrontCountryLabel(countryCode, locale);
}
