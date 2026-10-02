import { describe, expect, it } from "vitest";
import { createStoreCommissionOverride, parseStoreCommissionOverride } from "../shared/storeCommissionOverride";

describe("store commission override", () => {
  it("accepts a Studio exception including a zero-percent gifted rate", () => {
    expect(createStoreCommissionOverride(0, "2026-10-02T22:00:00.000Z")).toEqual({
      commissionRateBps: 0,
      updatedAt: "2026-10-02T22:00:00.000Z",
      source: "studio_manual",
    });
    expect(parseStoreCommissionOverride(JSON.stringify(createStoreCommissionOverride(375, "2026-10-02T22:00:00.000Z"))))
      .toMatchObject({ commissionRateBps: 375, source: "studio_manual" });
  });

  it("rejects malformed, out-of-range and unknown-source records", () => {
    expect(() => createStoreCommissionOverride(-1)).toThrow("STORE_COMMISSION_OVERRIDE_RATE_INVALID");
    expect(() => createStoreCommissionOverride(10_001)).toThrow("STORE_COMMISSION_OVERRIDE_RATE_INVALID");
    expect(parseStoreCommissionOverride(JSON.stringify({ commissionRateBps: 250, updatedAt: "2026-10-02T22:00:00.000Z", source: "owner" }))).toBeNull();
    expect(parseStoreCommissionOverride("not-json")).toBeNull();
  });
});
