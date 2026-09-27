import { describe, expect, it } from "vitest";
import { defaultSaasPlanCatalog, normalizeSaasPlanCatalog, parseSaasPlanCatalog } from "../shared/saasPlanCatalog";

describe("SaaS plan catalog", () => {
  it("keeps the official Free Basic Pro and Lifetime offers as draft templates", () => {
    const catalog = defaultSaasPlanCatalog();
    expect(catalog.plans.map(plan => plan.id)).toEqual(["free", "basic", "pro", "lifetime"]);
    expect(catalog.plans.every(plan => plan.status === "draft")).toBe(true);
    expect(catalog.plans.find(plan => plan.id === "pro")?.features).toContain("dropshipping_import");
  });

  it("upgrades the previous basic/pro grid without losing its feature snapshots", () => {
    const catalog = normalizeSaasPlanCatalog({
      plans: [
        { id: "basic", name: "BASIC", description: "Ancienne offre", monthlyAmountCents: 0, yearlyAmountCents: 0, currency: "CHF", features: ["storefront_seo", "unknown"] },
        { id: "pro", name: "PRO", description: "Ancienne offre payante", monthlyAmountCents: 790, yearlyAmountCents: 0, currency: "CHF", features: ["team_access"] },
        { id: "studio", name: "Studio", description: "Offre en préparation", monthlyAmountCents: 7900, yearlyAmountCents: 79000, currency: "CHF", features: ["team_access"] },
      ],
    });
    expect(catalog.plans.map(plan => plan.id)).toEqual(["free", "basic", "pro", "lifetime", "studio"]);
    expect(catalog.plans[0]).toMatchObject({ name: "FREE", currency: "CHF", monthlyAmountCents: 0, features: ["storefront_seo"], status: "draft" });
    expect(catalog.plans[1]).toMatchObject({ name: "BASIC", currency: "CHF", monthlyAmountCents: 790, features: ["team_access"], status: "draft" });
  });

  it("falls back safely when persisted data is malformed", () => {
    expect(parseSaasPlanCatalog("{not-json}").plans.map(plan => plan.id)).toEqual(["free", "basic", "pro", "lifetime"]);
  });
});
