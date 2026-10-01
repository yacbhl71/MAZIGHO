import type { SaasPlanCatalogItem, SaasPlanFeatureId } from "./saasPlanCatalog";
import { saasPlanFeatureIds } from "./saasPlanCatalog";
import { getMazighoSaasPlan } from "./mazighoSaasPlans";

export type StoreSaasPlanAssignment = {
  planId: string;
  planName: string;
  features: SaasPlanFeatureId[];
  /** Present on assignments created after the Free / Basic / Pro grid rollout. */
  gridVersion?: 2;
  /** Immutable price selected manually for a LIFETIME founder slot, in CHF cents. */
  lifetimePurchasePriceCents: number | null;
  status: "draft";
  assignedAt: string;
};

function isFeature(value: unknown): value is SaasPlanFeatureId {
  return typeof value === "string" && (saasPlanFeatureIds as readonly string[]).includes(value);
}

function isPlanId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9-]{1,39}$/.test(value);
}

/**
 * The first official grid used BASIC for the free tier and PRO for CHF 7.90.
 * Read-time normalization keeps every existing boutique on the commercially
 * equivalent tier after Free / Basic / Pro replaced that grid, without a bulk
 * write or a surprise change to a historical snapshot.
 */
function upgradeLegacyPlanId(planId: string, planName: string, gridVersion: unknown): string {
  if (gridVersion === 2) return planId;
  const normalizedName = planName.trim().toUpperCase();
  if (planId === "basic" && normalizedName === "BASIC") return "free";
  if (planId === "pro" && normalizedName === "PRO") return "basic";
  return planId;
}

/**
 * Parses a snapshot assignment only. Feature values are descriptive until a
 * separately approved enforcement layer exists; no current tenant access is
 * altered by reading or writing this setting.
 */
export function parseStoreSaasPlanAssignment(value: unknown): StoreSaasPlanAssignment | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const source = JSON.parse(value) as Record<string, unknown>;
    const rawPlanId = isPlanId(source.planId) ? source.planId : null;
    const rawPlanName = typeof source.planName === "string" ? source.planName.trim().replace(/\s+/g, " ").slice(0, 60) : "";
    const planId = rawPlanId ? upgradeLegacyPlanId(rawPlanId, rawPlanName, source.gridVersion) : null;
    const planName = planId === "free" && rawPlanName === "BASIC" ? "FREE"
      : planId === "basic" && rawPlanName === "PRO" ? "BASIC"
        : rawPlanName;
    const features = Array.isArray(source.features) ? Array.from(new Set(source.features.filter(isFeature))).sort() : [];
    const lifetimePurchasePriceCents = Number.isInteger(source.lifetimePurchasePriceCents) && Number(source.lifetimePurchasePriceCents) >= 0 && Number(source.lifetimePurchasePriceCents) <= 100_000_000
      ? Number(source.lifetimePurchasePriceCents)
      : null;
    const assignedAt = typeof source.assignedAt === "string" && !Number.isNaN(Date.parse(source.assignedAt)) ? source.assignedAt : "";
    if (!planId || !planName || !assignedAt) return null;
    return { planId, planName, features, lifetimePurchasePriceCents, status: "draft", assignedAt, ...(source.gridVersion === 2 ? { gridVersion: 2 as const } : {}) };
  } catch {
    return null;
  }
}

/** Captures the plan features at the moment of manual Studio assignment. */
export function assignStoreSaasPlanTemplate(plan: SaasPlanCatalogItem, assignedAt = new Date().toISOString(), lifetimePurchasePriceCents: number | null = null): StoreSaasPlanAssignment {
  if (!isPlanId(plan.id) || !plan.name.trim() || Number.isNaN(Date.parse(assignedAt))) throw new Error("SAAS_PLAN_ASSIGNMENT_INVALID");
  if (!getMazighoSaasPlan(plan.id)) throw new Error("SAAS_PLAN_TEMPLATE_NOT_OFFICIAL");
  if (plan.id === "lifetime" && (lifetimePurchasePriceCents === null || !Number.isInteger(lifetimePurchasePriceCents) || lifetimePurchasePriceCents < 0)) throw new Error("SAAS_LIFETIME_PRICE_SNAPSHOT_REQUIRED");
  return { planId: plan.id, planName: plan.name.trim().replace(/\s+/g, " ").slice(0, 60), features: Array.from(new Set(plan.features)).sort(), lifetimePurchasePriceCents: plan.id === "lifetime" ? lifetimePurchasePriceCents : null, status: "draft", assignedAt, gridVersion: 2 };
}
