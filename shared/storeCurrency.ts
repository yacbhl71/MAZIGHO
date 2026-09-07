export const SUPPORTED_STORE_CURRENCIES = ["CHF", "EUR", "USD", "GBP", "CAD"] as const;

export type StoreCurrencyCode = (typeof SUPPORTED_STORE_CURRENCIES)[number];

export type StoreCurrencyConfig = {
  code: StoreCurrencyCode;
  /** Number of target-currency minor units per 10,000 CHF minor units. */
  rateBps: number;
};

export const DEFAULT_STORE_CURRENCY: StoreCurrencyConfig = { code: "CHF", rateBps: 10_000 };

export const STORE_CURRENCY_LABELS: Record<StoreCurrencyCode, string> = {
  CHF: "Franc suisse (CHF)",
  EUR: "Euro (EUR)",
  USD: "Dollar américain (USD)",
  GBP: "Livre sterling (GBP)",
  CAD: "Dollar canadien (CAD)",
};

export function isStoreCurrencyCode(value: unknown): value is StoreCurrencyCode {
  return typeof value === "string" && (SUPPORTED_STORE_CURRENCIES as readonly string[]).includes(value);
}

export function normalizeStoreCurrencyConfig(input: { code?: unknown; rateBps?: unknown }): StoreCurrencyConfig {
  const code = isStoreCurrencyCode(input.code) ? input.code : DEFAULT_STORE_CURRENCY.code;
  const parsedRate = typeof input.rateBps === "number" ? input.rateBps : Number(input.rateBps);
  if (code === "CHF") return DEFAULT_STORE_CURRENCY;
  if (!Number.isInteger(parsedRate) || parsedRate < 1_000 || parsedRate > 50_000) {
    return { code, rateBps: 10_000 };
  }
  return { code, rateBps: parsedRate };
}

/** Converts a CHF-cent source amount into target-currency minor units with standard half-up rounding. */
export function convertChfCents(amountChfCents: number, config: StoreCurrencyConfig): number {
  if (!Number.isSafeInteger(amountChfCents)) throw new Error("CURRENCY_AMOUNT_INVALID");
  return Math.round((amountChfCents * config.rateBps) / 10_000);
}

/** Converts target-currency minor units back to CHF cents for administrator input stored in MAZIGHO's canonical CHF catalogue. */
export function convertToChfCents(amountTargetCents: number, config: StoreCurrencyConfig): number {
  if (!Number.isSafeInteger(amountTargetCents) || config.rateBps <= 0) throw new Error("CURRENCY_AMOUNT_INVALID");
  return Math.round((amountTargetCents * 10_000) / config.rateBps);
}

export function calculateConvertedCartTotals(input: {
  lines: Array<{ unitAmountChf: number; quantity: number }>;
  shippingAmountChf: number;
  discountAmountChf?: number;
  currency: StoreCurrencyConfig;
}) {
  const subtotal = input.lines.reduce((sum, line) => sum + convertChfCents(line.unitAmountChf, input.currency) * line.quantity, 0);
  const shipping = convertChfCents(input.shippingAmountChf, input.currency);
  const discount = convertChfCents(input.discountAmountChf ?? 0, input.currency);
  return { subtotal, shipping, discount, total: Math.max(0, subtotal + shipping - discount) };
}

export function currencyConfigFromSettings(settings: Array<{ key: string; value: string }>): StoreCurrencyConfig {
  const values = new Map(settings.map(setting => [setting.key, setting.value.trim()]));
  return normalizeStoreCurrencyConfig({
    code: values.get("store_currency_code"),
    rateBps: values.get("store_currency_rate_bps"),
  });
}
