export const OFFICIAL_CURRENCY_CODE = "CHF";
export const CURRENCY_SYMBOL = OFFICIAL_CURRENCY_CODE;

const numberFormatLocales: Record<string, string> = {
  fr: "fr-CH",
  de: "de-CH",
  it: "it-CH",
  en: "en-CH",
  es: "es-ES",
  nl: "nl-NL",
  ar: "ar",
};

function getNumberFormatLocale(locale: string) {
  return numberFormatLocales[locale] || numberFormatLocales.fr;
}

/**
 * Formats an official MAZIGHO amount. Product and shipping records are stored
 * and displayed in CHF until checkout can lock a paid foreign-currency amount.
 */
export function formatPrice(cents: number | null | undefined, locale = "fr"): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat(getNumberFormatLocale(locale), {
    style: "currency",
    currency: OFFICIAL_CURRENCY_CODE,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatPriceShort(cents: number | null | undefined, locale = "fr"): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat(getNumberFormatLocale(locale), {
    style: "currency",
    currency: OFFICIAL_CURRENCY_CODE,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
