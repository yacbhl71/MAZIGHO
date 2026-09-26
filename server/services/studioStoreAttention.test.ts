import { describe, expect, it } from "vitest";
import { assessStudioStoreAttention } from "./studioStoreAttention";

const healthyClient = { status: "active" as const, isPlatformStore: 0, activeOwners: 1, activeProductCount: 3, stockSignal: { low: 0, out: 0 } };

describe("Studio tenant attention policy", () => {
  it("prioritizes lifecycle and access signals without changing them", () => {
    expect(assessStudioStoreAttention({ ...healthyClient, status: "suspended" })).toEqual({ score: 100, needsAttention: true });
    expect(assessStudioStoreAttention({ ...healthyClient, activeOwners: 0 })).toEqual({ score: 70, needsAttention: true });
  });

  it("prioritizes stock and catalogue signals after access", () => {
    expect(assessStudioStoreAttention({ ...healthyClient, stockSignal: { low: 0, out: 2 } })).toEqual({ score: 60, needsAttention: true });
    expect(assessStudioStoreAttention({ ...healthyClient, activeProductCount: 0 })).toEqual({ score: 40, needsAttention: true });
  });

  it("keeps a healthy client outside the follow-up queue", () => {
    expect(assessStudioStoreAttention(healthyClient)).toEqual({ score: 20, needsAttention: false });
  });
});
