export const STORE_COMMISSION_OVERRIDE_MAX_BPS = 10_000;

/**
 * Operator-only exception to the public plan commission.
 *
 * It is deliberately stored separately from a plan assignment: the public
 * commercial grid stays immutable, while MAZIGHO Studio can grant a named
 * tenant a distinct Stripe application-fee rate (including 0%).
 */
export type StoreCommissionOverride = {
  commissionRateBps: number;
  updatedAt: string;
  source: "studio_manual";
};

function isValidCommissionRateBps(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= STORE_COMMISSION_OVERRIDE_MAX_BPS;
}

export function createStoreCommissionOverride(commissionRateBps: number, updatedAt = new Date().toISOString()): StoreCommissionOverride {
  if (!isValidCommissionRateBps(commissionRateBps)) throw new Error("STORE_COMMISSION_OVERRIDE_RATE_INVALID");
  if (Number.isNaN(Date.parse(updatedAt))) throw new Error("STORE_COMMISSION_OVERRIDE_TIMESTAMP_INVALID");
  return { commissionRateBps, updatedAt, source: "studio_manual" };
}

/** Invalid or historic malformed values are ignored, never applied to a checkout. */
export function parseStoreCommissionOverride(value: string | null | undefined): StoreCommissionOverride | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoreCommissionOverride>;
    if (!isValidCommissionRateBps(parsed.commissionRateBps)) return null;
    if (parsed.source !== "studio_manual") return null;
    if (typeof parsed.updatedAt !== "string" || Number.isNaN(Date.parse(parsed.updatedAt))) return null;
    return {
      commissionRateBps: parsed.commissionRateBps,
      updatedAt: parsed.updatedAt,
      source: "studio_manual",
    };
  } catch {
    return null;
  }
}

export function formatCommissionRate(commissionRateBps: number): string {
  if (!isValidCommissionRateBps(commissionRateBps)) return "—";
  return new Intl.NumberFormat("fr-CH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(commissionRateBps / 100);
}
