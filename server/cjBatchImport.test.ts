import { describe, expect, it } from "vitest";
import { CJ_CUSTOM_SOURCING_LIMITS, isFastTrackedCjMethod } from "./cjBatchImport";

describe("custom CJ sourcing transport guard", () => {
  it("accepts only an explicitly named fast CJPacket option", () => {
    expect(isFastTrackedCjMethod("CJ Packet Fast Line", "5-12")).toBe(true);
    expect(isFastTrackedCjMethod("CJPacket Express", "3-8")).toBe(true);
  });

  it("rejects postal, slow and non-CJPacket options", () => {
    expect(isFastTrackedCjMethod("CJPacket Postal", "5-12")).toBe(false);
    expect(isFastTrackedCjMethod("CJ Packet Fast Line", "12-20")).toBe(false);
    expect(isFastTrackedCjMethod("DHL Express", "2-5")).toBe(false);
    expect(isFastTrackedCjMethod("CJPacket Fast Line", null)).toBe(false);
  });

  it("keeps the manual sourcing limits bounded", () => {
    expect(CJ_CUSTOM_SOURCING_LIMITS.maxRequestedProducts).toBe(12);
    expect(CJ_CUSTOM_SOURCING_LIMITS.maxDraftLimit).toBe(50);
    expect(CJ_CUSTOM_SOURCING_LIMITS.maxFastDeliveryDays).toBe(15);
  });
});
