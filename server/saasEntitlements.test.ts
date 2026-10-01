import { describe, expect, it } from "vitest";
import { formatSaasMediaQuota, getSaasPlanEntitlements } from "../shared/saasEntitlements";

describe("MAZIGHO SaaS entitlements", () => {
  it("defaults an unassigned shop to the Free protections", () => {
    expect(getSaasPlanEntitlements(undefined)).toMatchObject({
      planId: "free",
      maxActiveProducts: 50,
      maxTeamMembers: 1,
      mediaQuotaBytes: 500 * 1024 * 1024,
      monthlyAiRequests: 40,
      dropshippingEnabled: false,
    });
  });

  it("differentiates paid capacity and reserves dropshipping for Pro", () => {
    expect(formatSaasMediaQuota(getSaasPlanEntitlements("free").mediaQuotaBytes)).toBe("500 Mo");
    expect(getSaasPlanEntitlements("basic")).toMatchObject({ maxActiveProducts: null, maxTeamMembers: 5, mediaQuotaBytes: 1024 * 1024 * 1024, monthlyAiRequests: 400, dropshippingEnabled: false });
    expect(getSaasPlanEntitlements("pro")).toMatchObject({ maxActiveProducts: null, maxTeamMembers: 8, mediaQuotaBytes: 2 * 1024 * 1024 * 1024, monthlyAiRequests: 1200, dropshippingEnabled: true });
    expect(getSaasPlanEntitlements("lifetime")).toMatchObject({ maxActiveProducts: null, maxTeamMembers: 10, mediaQuotaBytes: 2 * 1024 * 1024 * 1024, monthlyAiRequests: 400, dropshippingEnabled: false });
  });
});
