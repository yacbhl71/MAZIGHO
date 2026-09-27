import { describe, expect, it } from "vitest";
import { formatSaasMediaQuota, getSaasPlanEntitlements } from "../shared/saasEntitlements";

describe("MAZIGHO SaaS entitlements", () => {
  it("defaults an unassigned shop to the BASIC protections", () => {
    expect(getSaasPlanEntitlements(undefined)).toMatchObject({
      planId: "basic",
      maxActiveProducts: 200,
      maxTeamMembers: 2,
      mediaQuotaBytes: 500 * 1024 * 1024,
    });
  });

  it("keeps BASIC media capped at 500 Mo and differentiates paid plans", () => {
    expect(formatSaasMediaQuota(getSaasPlanEntitlements("basic").mediaQuotaBytes)).toBe("500 Mo");
    expect(getSaasPlanEntitlements("pro")).toMatchObject({ maxActiveProducts: null, maxTeamMembers: 5, mediaQuotaBytes: 1024 * 1024 * 1024 });
    expect(getSaasPlanEntitlements("lifetime")).toMatchObject({ maxActiveProducts: null, maxTeamMembers: 10, mediaQuotaBytes: 2 * 1024 * 1024 * 1024 });
  });
});
