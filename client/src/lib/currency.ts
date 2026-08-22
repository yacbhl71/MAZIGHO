export const CURRENCY_SYMBOL = "CHF";

export function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `${(cents / 100).toFixed(2)} ${CURRENCY_SYMBOL}`;
}

export function formatPriceShort(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `${(cents / 100).toFixed(2)}${CURRENCY_SYMBOL}`;
}
