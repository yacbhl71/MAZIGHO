import { describe, expect, it } from "vitest";
import { assignStoreSaasPlanTemplate, parseStoreSaasPlanAssignment } from "../shared/storeSaasPlanAssignment";

describe("store SaaS plan assignment", () => {
  it("snapshots the selected commercial feature list for a tenant", () => {
    const assignment = assignStoreSaasPlanTemplate({ id: "basic", name: "Basic", description: "", monthlyAmountCents: 2900, yearlyAmountCents: 29000, currency: "CHF", features: ["team_access", "brand_customization"], status: "draft" }, "2026-09-26T00:00:00.000Z");
    expect(assignment).toEqual({ planId: "basic", planName: "Basic", features: ["brand_customization", "team_access"], lifetimePurchasePriceCents: null, status: "draft", assignedAt: "2026-09-26T00:00:00.000Z", gridVersion: 2 });
  });

  it("requires and preserves the manually selected Lifetime purchase price", () => {
    const lifetime = { id: "lifetime", name: "Lifetime", description: "", monthlyAmountCents: 0, yearlyAmountCents: 0, currency: "CHF" as const, features: [], status: "draft" as const };
    expect(() => assignStoreSaasPlanTemplate(lifetime, "2026-09-26T00:00:00.000Z")).toThrow("SAAS_LIFETIME_PRICE_SNAPSHOT_REQUIRED");
    expect(assignStoreSaasPlanTemplate(lifetime, "2026-09-26T00:00:00.000Z", 14900).lifetimePurchasePriceCents).toBe(14900);
  });

  it("discards malformed assignment data", () => {
    expect(parseStoreSaasPlanAssignment(JSON.stringify({ planId: "basic", planName: "Basic", features: ["unknown"], assignedAt: "invalid" }))).toBeNull();
  });

  it("upgrades the former Basic and Pro snapshots without changing a new Pro assignment", () => {
    expect(parseStoreSaasPlanAssignment(JSON.stringify({ planId: "basic", planName: "BASIC", features: [], assignedAt: "2026-09-27T00:00:00.000Z" }))).toMatchObject({ planId: "free", planName: "FREE" });
    expect(parseStoreSaasPlanAssignment(JSON.stringify({ planId: "pro", planName: "PRO", features: [], assignedAt: "2026-09-27T00:00:00.000Z" }))).toMatchObject({ planId: "basic", planName: "BASIC" });
    expect(parseStoreSaasPlanAssignment(JSON.stringify({ planId: "pro", planName: "PRO", features: [], assignedAt: "2026-09-28T00:00:00.000Z", gridVersion: 2 }))).toMatchObject({ planId: "pro", planName: "PRO", gridVersion: 2 });
  });
});
