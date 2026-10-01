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
  /** Server-enforced assistant calls per calendar month, across text and vision. */
  monthlyAiRequests: number;
  /** Private Workspace documents retained per boutique. */
  maxWorkspaceDocuments: number;
  /** Reusable private Workspace templates retained per boutique. */
  maxWorkspaceTemplates: number;
  /** Supplier import space. A Studio grant can extend this to one chosen store. */
  dropshippingEnabled: boolean;
};

/**
 * Server-enforced commercial allowances. A shop without an explicit Studio
 * assignment is safely treated as FREE; this never removes existing data.
 */
export const saasPlanEntitlements: Readonly<Record<MazighoSaasPlanId, SaasPlanEntitlements>> = {
  free: {
    planId: "free",
    maxActiveProducts: 50,
    maxTeamMembers: 1,
    mediaQuotaBytes: 500 * MEBIBYTE,
    monthlyAiRequests: 40,
    maxWorkspaceDocuments: 10,
    maxWorkspaceTemplates: 5,
    dropshippingEnabled: false,
  },
  basic: {
    planId: "basic",
    maxActiveProducts: null,
    maxTeamMembers: 5,
    mediaQuotaBytes: 1024 * MEBIBYTE,
    monthlyAiRequests: 400,
    maxWorkspaceDocuments: 40,
    maxWorkspaceTemplates: 15,
    dropshippingEnabled: false,
  },
  pro: {
    planId: "pro",
    maxActiveProducts: null,
    maxTeamMembers: 8,
    mediaQuotaBytes: 2 * 1024 * MEBIBYTE,
    monthlyAiRequests: 1200,
    maxWorkspaceDocuments: 80,
    maxWorkspaceTemplates: 30,
    dropshippingEnabled: true,
  },
  lifetime: {
    planId: "lifetime",
    maxActiveProducts: null,
    maxTeamMembers: 10,
    mediaQuotaBytes: 2 * 1024 * MEBIBYTE,
    monthlyAiRequests: 400,
    maxWorkspaceDocuments: 40,
    maxWorkspaceTemplates: 15,
    dropshippingEnabled: false,
  },
};

export function getSaasPlanEntitlements(planId: unknown): SaasPlanEntitlements {
  const resolvedPlanId = isMazighoSaasPlanId(planId) ? planId : "free";
  return saasPlanEntitlements[resolvedPlanId];
}

export function formatSaasMediaQuota(mediaQuotaBytes: number): string {
  const mebibytes = Math.round(mediaQuotaBytes / MEBIBYTE);
  return mebibytes >= 1024 ? `${mebibytes / 1024} Go` : `${mebibytes} Mo`;
}
