import { describe, expect, it } from "vitest";
import { buildSaasPortfolioMetrics } from "./saasPortfolioMetrics";

describe("SaaS portfolio metrics", () => {
  it("reports draft equivalents and lifecycle facts without inventing churn", () => {
    const metrics = buildSaasPortfolioMetrics([
      { status: "active", billing: { plan: { kind: "rental", amountCents: 4900, currency: "CHF", interval: "monthly" }, invoices: [{ amountCents: 4900, currency: "CHF" }] } },
      { status: "setup", billing: { plan: { kind: "rental", amountCents: 12000, currency: "EUR", interval: "yearly" }, invoices: [] } },
      { status: "closed", billing: { plan: { kind: "perpetual_sale", amountCents: 99000, currency: "CHF", interval: "one_time" }, invoices: [{ amountCents: 99000, currency: "CHF" }] } },
    ]);
    expect(metrics).toMatchObject({
      clientStores: 3,
      publicStorefronts: 1,
      setupStores: 1,
      pausedStores: 1,
      plannedSubscriptions: 2,
      perpetualSales: 1,
      invoiceDrafts: 2,
      monthlyEquivalentByCurrency: { CHF: 4900, EUR: 1000 },
      invoiceDraftTotalsByCurrency: { CHF: 103900 },
      churn: { available: false },
    });
  });
});
