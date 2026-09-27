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

  it("keeps the Lifetime Studio sale at a single CHF 300 price", () => {
    expect(getLifetimePriceCents()).toBe(30000);
  });
});
