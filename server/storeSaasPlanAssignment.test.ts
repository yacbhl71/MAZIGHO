import { describe, expect, it } from "vitest";
import { assignStoreSaasPlanTemplate, parseStoreSaasPlanAssignment } from "../shared/storeSaasPlanAssignment";

describe("store SaaS plan assignment", () => {
  it("snapshots chosen plan features as a non-enforced draft", () => {
    const assignment = assignStoreSaasPlanTemplate({ id: "basic", name: "Basic", description: "", monthlyAmountCents: 2900, yearlyAmountCents: 29000, currency: "CHF", features: ["team_access", "brand_customization"], status: "draft" }, "2026-09-26T00:00:00.000Z");
    expect(assignment).toEqual({ planId: "basic", planName: "Basic", features: ["brand_customization", "team_access"], status: "draft", assignedAt: "2026-09-26T00:00:00.000Z" });
  });

  it("discards malformed assignment data", () => {
    expect(parseStoreSaasPlanAssignment(JSON.stringify({ planId: "basic", planName: "Basic", features: ["unknown"], assignedAt: "invalid" }))).toBeNull();
  });
});
