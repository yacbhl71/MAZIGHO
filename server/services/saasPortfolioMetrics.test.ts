import { describe, expect, it } from "vitest";
import { buildSaasPortfolioMetrics } from "./saasPortfolioMetrics";

describe("SaaS portfolio metrics", () => {
  it("reports draft equivalents and lifecycle facts without inventing churn", () => {
    const metrics = buildSaasPortfolioMetrics([
      { status: "active", billing: { plan: { kind: "rental", amountCents: 790, currency: "CHF", interval: "monthly" }, invoices: [{ amountCents: 790, currency: "CHF" }] } },
      { status: "setup", billing: { plan: { kind: "rental", amountCents: 12000, currency: "EUR", interval: "yearly" }, invoices: [] } },
      { status: "closed", billing: { plan: { kind: "perpetual_sale", amountCents: 30000, currency: "CHF", interval: "one_time" }, invoices: [{ amountCents: 30000, currency: "CHF" }] } },
    ]);
    expect(metrics).toMatchObject({
      clientStores: 3,
      publicStorefronts: 1,
      setupStores: 1,
      pausedStores: 1,
      plannedSubscriptions: 2,
      perpetualSales: 1,
      invoiceDrafts: 2,
      monthlyEquivalentByCurrency: { CHF: 790, EUR: 1000 },
      invoiceDraftTotalsByCurrency: { CHF: 30790 },
      churn: { available: false },
    });
  });
});
