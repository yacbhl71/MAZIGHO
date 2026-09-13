export type OwnerShippingMode = "included" | "flat_rate";

export type OwnerShippingReturnsSettings = {
  mode: OwnerShippingMode;
  freeShippingThresholdCents: number;
  flatShippingRateCents: number;
  servedCountries: string[];
  deliveryLeadTime: string;
  returnsSummary: string;
};

export const DEFAULT_OWNER_SHIPPING_RETURNS_SETTINGS: OwnerShippingReturnsSettings = {
  mode: "included",
  freeShippingThresholdCents: 0,
  flatShippingRateCents: 0,
  servedCountries: [],
  deliveryLeadTime: "",
  returnsSummary: "",
};

const MAX_MONEY_CENTS = 10_000_000;
const MAX_COUNTRIES = 25;

function normalizeMoneyCents(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > MAX_MONEY_CENTS) return 0;
  return value;
}

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeCountries(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value
    .filter((country): country is string => typeof country === "string")
    .map(country => country.trim().toUpperCase())
    .filter(country => /^[A-Z]{2,3}$/.test(country))))
    .slice(0, MAX_COUNTRIES);
}

/**
 * Restricts editable shipping and returns data to a small, non-sensitive profile.
 * It deliberately contains no carrier, supplier, payment, customer or fulfillment data.
 */
export function normalizeOwnerShippingReturnsSettings(input: Partial<OwnerShippingReturnsSettings>): OwnerShippingReturnsSettings {
  const mode: OwnerShippingMode = input.mode === "flat_rate" ? "flat_rate" : "included";
  return {
    mode,
    flatShippingRateCents: mode === "flat_rate" ? normalizeMoneyCents(input.flatShippingRateCents) : 0,
    freeShippingThresholdCents: mode === "flat_rate" ? normalizeMoneyCents(input.freeShippingThresholdCents) : 0,
    servedCountries: normalizeCountries(input.servedCountries),
    deliveryLeadTime: normalizeText(input.deliveryLeadTime, 120),
    returnsSummary: normalizeText(input.returnsSummary, 1_500),
  };
}

/** Safely reads a stored profile and ignores malformed legacy data. */
export function parseOwnerShippingReturnsSettings(value: string | null | undefined): OwnerShippingReturnsSettings {
  if (!value) return { ...DEFAULT_OWNER_SHIPPING_RETURNS_SETTINGS };
  try {
    const parsed = JSON.parse(value) as Partial<OwnerShippingReturnsSettings>;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_OWNER_SHIPPING_RETURNS_SETTINGS };
    return normalizeOwnerShippingReturnsSettings(parsed);
  } catch {
    return { ...DEFAULT_OWNER_SHIPPING_RETURNS_SETTINGS };
  }
}

export function describeShippingPreview(settings: OwnerShippingReturnsSettings, currencyCode: string) {
  const currency = currencyCode.trim().toUpperCase() || "CHF";
  if (settings.mode === "included") {
    return { title: "Livraison offerte", detail: "Aucun frais de livraison supplémentaire n’est prévu dans cette configuration." };
  }

  const rate = (settings.flatShippingRateCents / 100).toFixed(2);
  if (settings.freeShippingThresholdCents <= 0) {
    return { title: `Tarif fixe : ${rate} ${currency}`, detail: "Le même tarif fixe est prévu pour chaque commande." };
  }

  const threshold = (settings.freeShippingThresholdCents / 100).toFixed(2);
  return { title: `Tarif fixe : ${rate} ${currency}`, detail: `Livraison offerte à partir de ${threshold} ${currency}.` };
}
