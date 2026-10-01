import { getMazighoSaasPlan, type MazighoSaasPlanId } from "./mazighoSaasPlans";
import type { StoreCommercialOfferMode } from "./storeCommercialOffer";
import { paginateStudioInventory, type RegistryStore, type StudioInventoryQuery } from "./studioInventoryRegistry";

export const studioSaasPlanFilters = ["all", "unassigned", "free", "basic", "pro", "lifetime"] as const;
export type StudioSaasPlanFilter = (typeof studioSaasPlanFilters)[number];
export type StudioSaasPortfolioQuery = StudioInventoryQuery & { planId?: StudioSaasPlanFilter };
type PlanStore = RegistryStore & { planAssignment: { planId: string } | null };

/** Only the four official plans are enforced; custom proposals count as unassigned. */
export function getEffectiveStudioSaasPlanId(store: PlanStore): MazighoSaasPlanId | null {
  return getMazighoSaasPlan(store.planAssignment?.planId)?.id ?? null;
}

/** A draft suggestion only: never starts a subscription, charge or invoice. */
export function suggestStudioSaasBillingDraft(planId: unknown, offerMode: StoreCommercialOfferMode) {
  const plan = getMazighoSaasPlan(planId);
  if (!plan || plan.billingKind === "commission_only") return null;
  const kind = plan.billingKind === "one_time" ? "perpetual_sale" as const : "rental" as const;
  if (kind !== offerMode) return null;
  return {
    kind,
    label: `MAZIGHO ${plan.name}`,
    amountCents: plan.billingKind === "one_time" ? plan.oneTimeAmountCents ?? 0 : plan.monthlyAmountCents,
    currency: "CHF" as const,
    interval: plan.billingKind === "one_time" ? "one_time" as const : "monthly" as const,
  };
}

export function summarizeStudioSaasPlanCoverage<T extends PlanStore>(stores: readonly T[]) {
  const coverage = { unassigned: 0, free: 0, basic: 0, pro: 0, lifetime: 0 };
  for (const store of stores) {
    const planId = getEffectiveStudioSaasPlanId(store);
    coverage[planId ?? "unassigned"]++;
  }
  return coverage;
}

export function paginateStudioSaasPortfolio<T extends PlanStore>(stores: readonly T[], input: StudioSaasPortfolioQuery = {}) {
  const filter = studioSaasPlanFilters.includes(input.planId as StudioSaasPlanFilter) ? input.planId : "all";
  const selected = filter === "all" ? stores : stores.filter(store => (getEffectiveStudioSaasPlanId(store) ?? "unassigned") === filter);
  const page = paginateStudioInventory(selected, input);
  return { ...page, filters: { ...page.filters, planId: filter } };
}
