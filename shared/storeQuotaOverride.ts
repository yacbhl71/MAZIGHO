import type { SaasPlanEntitlements } from "./saasEntitlements";

export const STORE_QUOTA_OVERRIDE_MAX_MEDIA_BYTES = 100 * 1024 * 1024 * 1024;
export const STORE_QUOTA_OVERRIDE_MAX_PRODUCTS = 1_000_000;
export const STORE_QUOTA_OVERRIDE_MAX_TEAM_MEMBERS = 1_000;
export const STORE_QUOTA_OVERRIDE_MAX_MONTHLY_AI_REQUESTS = 100_000;
export const STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS = 10_000;

/**
 * Operator-only exception to a boutique's plan capacities.
 *
 * The public plan is never rewritten: this explicit record only adjusts the
 * server-enforced capacities of one named tenant. It is suitable for a gift,
 * a pilot or a negotiated commercial arrangement, without creating a plan,
 * an invoice, an e-mail or a payment.
 */
export type StoreQuotaOverride = Pick<
  SaasPlanEntitlements,
  | "maxActiveProducts"
  | "maxTeamMembers"
  | "mediaQuotaBytes"
  | "monthlyAiRequests"
  | "maxWorkspaceDocuments"
  | "maxWorkspaceTemplates"
> & {
  updatedAt: string;
  source: "studio_manual";
};

export type StoreQuotaOverrideInput = Omit<StoreQuotaOverride, "updatedAt" | "source">;

function isPositiveInteger(value: unknown, maximum: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= maximum;
}

function isUnlimitedOrPositiveInteger(value: unknown, maximum: number): value is number | null {
  return value === null || isPositiveInteger(value, maximum);
}

function isValidStoreQuotaOverride(value: Partial<StoreQuotaOverride>): value is StoreQuotaOverride {
  return isUnlimitedOrPositiveInteger(value.maxActiveProducts, STORE_QUOTA_OVERRIDE_MAX_PRODUCTS)
    && isUnlimitedOrPositiveInteger(value.maxTeamMembers, STORE_QUOTA_OVERRIDE_MAX_TEAM_MEMBERS)
    && isPositiveInteger(value.mediaQuotaBytes, STORE_QUOTA_OVERRIDE_MAX_MEDIA_BYTES)
    && isPositiveInteger(value.monthlyAiRequests, STORE_QUOTA_OVERRIDE_MAX_MONTHLY_AI_REQUESTS)
    && isPositiveInteger(value.maxWorkspaceDocuments, STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS)
    && isPositiveInteger(value.maxWorkspaceTemplates, STORE_QUOTA_OVERRIDE_MAX_WORKSPACE_ITEMS)
    && value.source === "studio_manual"
    && typeof value.updatedAt === "string"
    && !Number.isNaN(Date.parse(value.updatedAt));
}

export function createStoreQuotaOverride(input: StoreQuotaOverrideInput, updatedAt = new Date().toISOString()): StoreQuotaOverride {
  const candidate: StoreQuotaOverride = { ...input, updatedAt, source: "studio_manual" };
  if (!isValidStoreQuotaOverride(candidate)) throw new Error("STORE_QUOTA_OVERRIDE_INVALID");
  return candidate;
}

/** Invalid, partial or historic malformed records never change a live quota. */
export function parseStoreQuotaOverride(value: string | null | undefined): StoreQuotaOverride | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoreQuotaOverride>;
    if (!isValidStoreQuotaOverride(parsed)) return null;
    return {
      maxActiveProducts: parsed.maxActiveProducts,
      maxTeamMembers: parsed.maxTeamMembers,
      mediaQuotaBytes: parsed.mediaQuotaBytes,
      monthlyAiRequests: parsed.monthlyAiRequests,
      maxWorkspaceDocuments: parsed.maxWorkspaceDocuments,
      maxWorkspaceTemplates: parsed.maxWorkspaceTemplates,
      updatedAt: parsed.updatedAt,
      source: "studio_manual",
    };
  } catch {
    return null;
  }
}

export function applyStoreQuotaOverride(base: SaasPlanEntitlements, override: StoreQuotaOverride | null): SaasPlanEntitlements {
  if (!override) return base;
  return {
    ...base,
    maxActiveProducts: override.maxActiveProducts,
    maxTeamMembers: override.maxTeamMembers,
    mediaQuotaBytes: override.mediaQuotaBytes,
    monthlyAiRequests: override.monthlyAiRequests,
    maxWorkspaceDocuments: override.maxWorkspaceDocuments,
    maxWorkspaceTemplates: override.maxWorkspaceTemplates,
  };
}
