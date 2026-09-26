export type SaasPortfolioMetricStore = {
  status: "setup" | "active" | "limited" | "suspended" | "closed" | string;
  billing: {
    plan: { kind: "rental" | "perpetual_sale"; amountCents: number; currency: string; interval: "monthly" | "yearly" | "one_time" } | null;
    invoices: Array<{ amountCents: number; currency: string }>;
  };
};

/**
 * Computes only facts available from draft SaaS plans and store lifecycle.
 * Churn is intentionally unavailable until real subscriptions have explicit
 * start/end/cancellation history; it must never be inferred from store status.
 */
export function buildSaasPortfolioMetrics(stores: readonly SaasPortfolioMetricStore[]) {
  const monthlyEquivalentByCurrency: Record<string, number> = {};
  const invoiceDraftTotalsByCurrency: Record<string, number> = {};

  for (const store of stores) {
    const plan = store.billing.plan;
    if (plan && plan.interval !== "one_time") {
      const monthlyAmount = plan.interval === "monthly" ? plan.amountCents : Math.round(plan.amountCents / 12);
      monthlyEquivalentByCurrency[plan.currency] = (monthlyEquivalentByCurrency[plan.currency] ?? 0) + monthlyAmount;
    }
    for (const invoice of store.billing.invoices) {
      invoiceDraftTotalsByCurrency[invoice.currency] = (invoiceDraftTotalsByCurrency[invoice.currency] ?? 0) + invoice.amountCents;
    }
  }

  return {
    clientStores: stores.length,
    publicStorefronts: stores.filter(store => store.status === "active" || store.status === "limited").length,
    setupStores: stores.filter(store => store.status === "setup").length,
    pausedStores: stores.filter(store => store.status === "suspended" || store.status === "closed").length,
    plannedSubscriptions: stores.filter(store => store.billing.plan?.kind === "rental").length,
    perpetualSales: stores.filter(store => store.billing.plan?.kind === "perpetual_sale").length,
    invoiceDrafts: stores.reduce((total, store) => total + store.billing.invoices.length, 0),
    monthlyEquivalentByCurrency,
    invoiceDraftTotalsByCurrency,
    churn: { available: false as const, reason: "Aucun abonnement actif ni historique de résiliation n’est encore enregistré." },
  };
}
