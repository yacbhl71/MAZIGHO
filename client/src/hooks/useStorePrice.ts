import { formatPrice, formatPriceShort } from "@/lib/currency";
import { useStoreCurrency } from "@/hooks/useStoreCurrency";

/**
 * Formats canonical CHF catalogue amounts in the active public storefront currency.
 * Checkout remains the sole authority for the final charged amount.
 */
export function useStorePrice() {
  const { currencyCode, convertFromChf } = useStoreCurrency();
  return {
    formatStorePrice: (amountChfCents: number | null | undefined, locale = "fr") => (
      amountChfCents == null ? "—" : formatPrice(convertFromChf(amountChfCents), locale, currencyCode)
    ),
    formatStorePriceShort: (amountChfCents: number | null | undefined, locale = "fr") => (
      amountChfCents == null ? "—" : formatPriceShort(convertFromChf(amountChfCents), locale, currencyCode)
    ),
    formatChargedPrice: (amountCurrencyCents: number | null | undefined, locale = "fr") => (
      amountCurrencyCents == null ? "—" : formatPrice(amountCurrencyCents, locale, currencyCode)
    ),
    currencyCode,
    convertFromChf,
  };
}
