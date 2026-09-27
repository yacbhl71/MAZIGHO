import { describe, expect, it } from "vitest";
import { getLifetimePriceCents, getMazighoSaasPlan, mazighoSaasPlans } from "../shared/mazighoSaasPlans";

describe("official MAZIGHO CHF plans", () => {
  it("keeps the published Free Basic Pro prices and commission rates", () => {
    expect(mazighoSaasPlans.map(plan => plan.id)).toEqual(["free", "basic", "pro", "lifetime"]);
    expect(getMazighoSaasPlan("free")).toMatchObject({ currency: "CHF", monthlyAmountCents: 0, commissionRateBps: 250 });
    expect(getMazighoSaasPlan("basic")).toMatchObject({ currency: "CHF", monthlyAmountCents: 790, commissionRateBps: 100 });
    expect(getMazighoSaasPlan("pro")).toMatchObject({ currency: "CHF", monthlyAmountCents: 1290, commissionRateBps: 100 });
    expect(getMazighoSaasPlan("lifetime")).toMatchObject({ currency: "CHF", oneTimeAmountCents: 30000, commissionRateBps: 0 });
  });

  it("uses the founder price only for the first one hundred Lifetime snapshots", () => {
    expect(getLifetimePriceCents(0)).toBe(14900);
    expect(getLifetimePriceCents(99)).toBe(14900);
    expect(getLifetimePriceCents(100)).toBe(30000);
  });
});
