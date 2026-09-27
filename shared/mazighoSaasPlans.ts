export const mazighoSaasPlanIds = ["free", "basic", "pro", "lifetime"] as const;

export type MazighoSaasPlanId = (typeof mazighoSaasPlanIds)[number];

export type MazighoSaasPlan = {
  id: MazighoSaasPlanId;
  name: string;
  description: string;
  currency: "CHF";
  billingKind: "commission_only" | "monthly" | "one_time";
  monthlyAmountCents: number;
  oneTimeAmountCents: number | null;
  commissionRateBps: number;
  launchLimitedToStores?: number;
  launchAmountCents?: number;
};

/**
 * Official MAZIGHO commercial grid. These figures are server-consumable
 * values, not display-only labels. Stripe application fees use basis points
 * (250 = 2.50%) to keep all calculations in integer minor units.
 *
 * The founder Lifetime offer remains a manually attributed, limited offer; it
 * is not part of the normal Free / Basic / Pro progression.
 */
export const mazighoSaasPlans: readonly MazighoSaasPlan[] = [
  {
    id: "free",
    name: "FREE",
    description: "0 CHF/mois + 2,5 % de commission sur chaque encaissement. Pour préparer et lancer une boutique avec les essentiels.",
    currency: "CHF",
    billingKind: "commission_only",
    monthlyAmountCents: 0,
    oneTimeAmountCents: null,
    commissionRateBps: 250,
  },
  {
    id: "basic",
    name: "BASIC",
    description: "7,90 CHF/mois + 1,0 % de commission sur chaque encaissement. Pour développer une boutique sans plafond de catalogue.",
    currency: "CHF",
    billingKind: "monthly",
    monthlyAmountCents: 790,
    oneTimeAmountCents: null,
    commissionRateBps: 100,
  },
  {
    id: "pro",
    name: "PRO",
    description: "12,90 CHF/mois + 1,0 % de commission sur chaque encaissement. Inclut l’espace dropshipping avec import contrôlé en brouillon.",
    currency: "CHF",
    billingKind: "monthly",
    monthlyAmountCents: 1290,
    oneTimeAmountCents: null,
    commissionRateBps: 100,
  },
  {
    id: "lifetime",
    name: "LIFETIME",
    description: "149 CHF une fois pour les 100 premières boutiques, puis 300 CHF ; 0 % de commission. Attribution fondatrice manuelle.",
    currency: "CHF",
    billingKind: "one_time",
    monthlyAmountCents: 0,
    oneTimeAmountCents: 30000,
    launchLimitedToStores: 100,
    launchAmountCents: 14900,
    commissionRateBps: 0,
  },
] as const;

export function isMazighoSaasPlanId(value: unknown): value is MazighoSaasPlanId {
  return typeof value === "string" && (mazighoSaasPlanIds as readonly string[]).includes(value);
}

export function getMazighoSaasPlan(value: unknown): MazighoSaasPlan | null {
  return isMazighoSaasPlanId(value) ? mazighoSaasPlans.find(plan => plan.id === value) ?? null : null;
}

/** Returns the price captured for a manually confirmed Lifetime founder slot. */
export function getLifetimePriceCents(assignedLifetimeStores: number): number {
  const lifetime = getMazighoSaasPlan("lifetime")!;
  return assignedLifetimeStores >= (lifetime.launchLimitedToStores ?? 0)
    ? lifetime.oneTimeAmountCents ?? 0
    : lifetime.launchAmountCents ?? lifetime.oneTimeAmountCents ?? 0;
}
