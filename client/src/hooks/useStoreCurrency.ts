import { convertChfCents, DEFAULT_STORE_CURRENCY, type StoreCurrencyCode } from "@shared/storeCurrency";
import { trpc } from "@/lib/trpc";

export function useStoreCurrency() {
  const query = trpc.content.getStoreCurrency.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const currency = query.data ?? DEFAULT_STORE_CURRENCY;
  return {
    currencyCode: currency.code as StoreCurrencyCode,
    currencyRateBps: currency.rateBps,
    convertFromChf: (amountChfCents: number) => convertChfCents(amountChfCents, currency),
    isLoadingCurrency: query.isLoading,
  };
}
