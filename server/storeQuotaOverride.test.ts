import { describe, expect, it } from "vitest";
import { applyStoreQuotaOverride, createStoreQuotaOverride, parseStoreQuotaOverride } from "../shared/storeQuotaOverride";
import { getSaasPlanEntitlements } from "../shared/saasEntitlements";

describe("store quota override", () => {
  it("allows Studio to grant unlimited products and tailored capacities", () => {
    const override = createStoreQuotaOverride({
      maxActiveProducts: null,
      maxTeamMembers: 20,
      mediaQuotaBytes: 5 * 1024 * 1024 * 1024,
      monthlyAiRequests: 5_000,
      maxWorkspaceDocuments: 300,
      maxWorkspaceTemplates: 100,
    }, "2026-10-04T00:00:00.000Z");
    expect(applyStoreQuotaOverride(getSaasPlanEntitlements("free"), override)).toMatchObject({
      planId: "free",
      maxActiveProducts: null,
      maxTeamMembers: 20,
      mediaQuotaBytes: 5 * 1024 * 1024 * 1024,
      monthlyAiRequests: 5_000,
    });
  });

  it("ignores malformed or unsafe stored records", () => {
    expect(() => createStoreQuotaOverride({ maxActiveProducts: 0, maxTeamMembers: 1, mediaQuotaBytes: 1, monthlyAiRequests: 1, maxWorkspaceDocuments: 1, maxWorkspaceTemplates: 1 })).toThrow("STORE_QUOTA_OVERRIDE_INVALID");
    expect(parseStoreQuotaOverride(JSON.stringify({ maxActiveProducts: null, maxTeamMembers: 1, mediaQuotaBytes: 1024, monthlyAiRequests: 100, maxWorkspaceDocuments: 10, maxWorkspaceTemplates: 5, updatedAt: "2026-10-04T00:00:00.000Z", source: "owner" }))).toBeNull();
  });
});
