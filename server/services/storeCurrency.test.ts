import { describe, expect, it } from "vitest";
import {
  calculateConvertedCartTotals,
  convertChfCents,
  convertToChfCents,
  currencyConfigFromSettings,
  DEFAULT_STORE_CURRENCY,
  normalizeStoreCurrencyConfig,
} from "../../shared/storeCurrency";

describe("store currency configuration", () => {
  it("keeps CHF as the safe default", () => {
    expect(normalizeStoreCurrencyConfig({})).toEqual(DEFAULT_STORE_CURRENCY);
    expect(currencyConfigFromSettings([])).toEqual(DEFAULT_STORE_CURRENCY);
  });

  it("converts with a stored rate and stable rounding", () => {
    const eur = normalizeStoreCurrencyConfig({ code: "EUR", rateBps: 9_600 });
    expect(convertChfCents(10_000, eur)).toBe(9_600);
    expect(convertChfCents(5490, eur)).toBe(5270);
    expect(convertToChfCents(9_600, eur)).toBe(10_000);
  });

  it("calculates a converted cart using per-line rounding", () => {
    const eur = normalizeStoreCurrencyConfig({ code: "EUR", rateBps: 9_600 });
    expect(calculateConvertedCartTotals({
      lines: [{ unitAmountChf: 1099, quantity: 2 }, { unitAmountChf: 250, quantity: 1 }],
      shippingAmountChf: 490,
      discountAmountChf: 100,
      currency: eur,
    })).toEqual({ subtotal: 2350, shipping: 470, discount: 96, total: 2724 });
  });

  it("refuses unsafe values by falling back to a neutral rate", () => {
    expect(normalizeStoreCurrencyConfig({ code: "EUR", rateBps: 999 })).toEqual({ code: "EUR", rateBps: 10_000 });
    expect(normalizeStoreCurrencyConfig({ code: "JPY", rateBps: 10_000 })).toEqual(DEFAULT_STORE_CURRENCY);
  });
});
