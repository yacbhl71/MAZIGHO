import { storefrontCountryCodes, type StorefrontCountryCode } from "./storeMarketSettings";

/**
 * Owner-declared tax display policy. This is deliberately a disclosure setting,
 * not a tax engine: it never calculates, collects or remits a tax.
 */
export const storeTaxDisplayModes = ["to_confirm", "included", "not_collected"] as const;
export type StoreTaxDisplayMode = (typeof storeTaxDisplayModes)[number];

export type StoreTaxPolicy = {
  countryCode: StorefrontCountryCode;
  displayMode: StoreTaxDisplayMode;
  /** Public wording supplied and reviewed by the shop operator. */
  notice: string;
};

export const DEFAULT_STORE_TAX_POLICIES: StoreTaxPolicy[] = [];

function isCountryCode(value: unknown): value is StorefrontCountryCode {
  return typeof value === "string" && storefrontCountryCodes.includes(value as StorefrontCountryCode);
}

function isDisplayMode(value: unknown): value is StoreTaxDisplayMode {
  return typeof value === "string" && storeTaxDisplayModes.includes(value as StoreTaxDisplayMode);
}

function normalizeNotice(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 360) : "";
}

/** Keeps storage bounded and allows only one disclosure policy per market. */
export function normalizeStoreTaxPolicies(input: unknown): StoreTaxPolicy[] {
  if (!Array.isArray(input)) return [];
  const byCountry = new Map<StorefrontCountryCode, StoreTaxPolicy>();
  for (const entry of input) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as Record<string, unknown>;
    if (!isCountryCode(candidate.countryCode) || !isDisplayMode(candidate.displayMode)) continue;
    byCountry.set(candidate.countryCode, {
      countryCode: candidate.countryCode,
      displayMode: candidate.displayMode,
      notice: normalizeNotice(candidate.notice),
    });
  }
  return Array.from(byCountry.values()).sort((left, right) => left.countryCode.localeCompare(right.countryCode));
}

export function parseStoreTaxPolicies(value: string | null | undefined): StoreTaxPolicy[] {
  if (!value) return [];
  try {
    return normalizeStoreTaxPolicies(JSON.parse(value));
  } catch {
    return [];
  }
}

export function getStoreTaxPolicyForCountry(policies: StoreTaxPolicy[], countryCode: string | undefined | null): StoreTaxPolicy | undefined {
  const normalizedCountry = countryCode?.trim().toUpperCase();
  return policies.find(policy => policy.countryCode === normalizedCountry);
}
