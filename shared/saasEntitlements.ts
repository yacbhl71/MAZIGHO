import { isMazighoSaasPlanId, type MazighoSaasPlanId } from "./mazighoSaasPlans";

export const MEBIBYTE = 1024 * 1024;

export type SaasPlanEntitlements = {
  planId: MazighoSaasPlanId;
  /** Maximum public, active products. Null means no product ceiling. */
  maxActiveProducts: number | null;
  /** Maximum active delegated memberships. The owner is never counted. */
  maxTeamMembers: number | null;
  /** Shared MAZIGHO Blob allowance for storefront and catalogue media. */
  mediaQuotaBytes: number;
};

/**
 * Server-enforced commercial allowances. A shop without an explicit Studio
 * assignment is safely treated as BASIC; this never removes existing data.
 */
export const saasPlanEntitlements: Readonly<Record<MazighoSaasPlanId, SaasPlanEntitlements>> = {
  basic: {
    planId: "basic",
    maxActiveProducts: 200,
    maxTeamMembers: 2,
    mediaQuotaBytes: 500 * MEBIBYTE,
  },
  pro: {
    planId: "pro",
    maxActiveProducts: null,
    maxTeamMembers: 5,
    mediaQuotaBytes: 1024 * MEBIBYTE,
  },
  lifetime: {
    planId: "lifetime",
    maxActiveProducts: null,
    maxTeamMembers: 10,
    mediaQuotaBytes: 2 * 1024 * MEBIBYTE,
  },
};

export function getSaasPlanEntitlements(planId: unknown): SaasPlanEntitlements {
  const resolvedPlanId = isMazighoSaasPlanId(planId) ? planId : "basic";
  return saasPlanEntitlements[resolvedPlanId];
}

export function formatSaasMediaQuota(mediaQuotaBytes: number): string {
  const mebibytes = Math.round(mediaQuotaBytes / MEBIBYTE);
  return mebibytes >= 1024 ? `${mebibytes / 1024} Go` : `${mebibytes} Mo`;
}
