import { describe, expect, it } from "vitest";
import { getLifetimePriceCents, getMazighoSaasPlan, mazighoSaasPlans } from "../shared/mazighoSaasPlans";

describe("official MAZIGHO CHF plans", () => {
  it("keeps the published CHF prices and commission rates", () => {
    expect(mazighoSaasPlans.map(plan => plan.id)).toEqual(["basic", "pro", "lifetime"]);
    expect(getMazighoSaasPlan("basic")).toMatchObject({ currency: "CHF", monthlyAmountCents: 0, commissionRateBps: 250 });
    expect(getMazighoSaasPlan("pro")).toMatchObject({ currency: "CHF", monthlyAmountCents: 790, commissionRateBps: 100 });
    expect(getMazighoSaasPlan("lifetime")).toMatchObject({ currency: "CHF", oneTimeAmountCents: 30000, commissionRateBps: 0 });
  });

  it("uses the founder price only for the first one hundred Lifetime snapshots", () => {
    expect(getLifetimePriceCents(0)).toBe(14900);
    expect(getLifetimePriceCents(99)).toBe(14900);
    expect(getLifetimePriceCents(100)).toBe(30000);
  });
});
