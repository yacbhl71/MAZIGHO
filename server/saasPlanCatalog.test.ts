import { describe, expect, it } from "vitest";
import { defaultSaasPlanCatalog, normalizeSaasPlanCatalog, parseSaasPlanCatalog } from "../shared/saasPlanCatalog";

describe("SaaS plan catalog", () => {
  it("keeps the three editable starter offers as draft templates", () => {
    const catalog = defaultSaasPlanCatalog();
    expect(catalog.plans.map(plan => plan.id)).toEqual(["free", "basic", "premium"]);
    expect(catalog.plans.every(plan => plan.status === "draft")).toBe(true);
  });

  it("normalizes features and restores a missing starter offer", () => {
    const catalog = normalizeSaasPlanCatalog({
      plans: [
        { id: "basic", name: "Essentiel", description: "Une offre test", monthlyAmountCents: 3500, yearlyAmountCents: 35000, currency: "EUR", features: ["storefront_seo", "storefront_seo", "unknown"] },
        { id: "studio", name: "Studio", description: "Offre en préparation", monthlyAmountCents: 7900, yearlyAmountCents: 79000, currency: "CHF", features: ["team_access"] },
      ],
    });
    expect(catalog.plans.map(plan => plan.id)).toEqual(["free", "basic", "premium", "studio"]);
    expect(catalog.plans[1]).toMatchObject({ name: "Essentiel", currency: "EUR", features: ["storefront_seo"], status: "draft" });
  });

  it("falls back safely when persisted data is malformed", () => {
    expect(parseSaasPlanCatalog("{not-json}").plans.map(plan => plan.id)).toEqual(["free", "basic", "premium"]);
  });
});
