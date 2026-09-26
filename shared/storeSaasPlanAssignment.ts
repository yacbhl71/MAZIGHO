import type { SaasPlanCatalogItem, SaasPlanFeatureId } from "./saasPlanCatalog";
import { saasPlanFeatureIds } from "./saasPlanCatalog";

export type StoreSaasPlanAssignment = {
  planId: string;
  planName: string;
  features: SaasPlanFeatureId[];
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
 * Parses a snapshot assignment only. Feature values are descriptive until a
 * separately approved enforcement layer exists; no current tenant access is
 * altered by reading or writing this setting.
 */
export function parseStoreSaasPlanAssignment(value: unknown): StoreSaasPlanAssignment | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const source = JSON.parse(value) as Record<string, unknown>;
    const planId = isPlanId(source.planId) ? source.planId : null;
    const planName = typeof source.planName === "string" ? source.planName.trim().replace(/\s+/g, " ").slice(0, 60) : "";
    const features = Array.isArray(source.features) ? Array.from(new Set(source.features.filter(isFeature))).sort() : [];
    const lifetimePurchasePriceCents = Number.isInteger(source.lifetimePurchasePriceCents) && Number(source.lifetimePurchasePriceCents) >= 0 && Number(source.lifetimePurchasePriceCents) <= 100_000_000
      ? Number(source.lifetimePurchasePriceCents)
      : null;
    const assignedAt = typeof source.assignedAt === "string" && !Number.isNaN(Date.parse(source.assignedAt)) ? source.assignedAt : "";
    if (!planId || !planName || !assignedAt) return null;
    return { planId, planName, features, lifetimePurchasePriceCents, status: "draft", assignedAt };
  } catch {
    return null;
  }
}

/** Captures the plan features at the moment of manual Studio assignment. */
export function assignStoreSaasPlanTemplate(plan: SaasPlanCatalogItem, assignedAt = new Date().toISOString(), lifetimePurchasePriceCents: number | null = null): StoreSaasPlanAssignment {
  if (!isPlanId(plan.id) || !plan.name.trim() || Number.isNaN(Date.parse(assignedAt))) throw new Error("SAAS_PLAN_ASSIGNMENT_INVALID");
  if (plan.id === "lifetime" && (lifetimePurchasePriceCents === null || !Number.isInteger(lifetimePurchasePriceCents) || lifetimePurchasePriceCents < 0)) throw new Error("SAAS_LIFETIME_PRICE_SNAPSHOT_REQUIRED");
  return { planId: plan.id, planName: plan.name.trim().replace(/\s+/g, " ").slice(0, 60), features: Array.from(new Set(plan.features)).sort(), lifetimePurchasePriceCents: plan.id === "lifetime" ? lifetimePurchasePriceCents : null, status: "draft", assignedAt };
}
