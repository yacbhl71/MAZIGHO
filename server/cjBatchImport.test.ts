import { describe, expect, it } from "vitest";
import { CJ_CUSTOM_SOURCING_LIMITS, isAllowedCjCustomShippingMethod, isFastTrackedCjMethod } from "./cjBatchImport";

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

  it("allows only explicitly selected fast delivery families", () => {
    expect(isAllowedCjCustomShippingMethod("DHL Express Worldwide", "2-5", ["express"])).toBe(true);
    expect(isAllowedCjCustomShippingMethod("YunExpress Special Line", "7-15", ["tracked_network"])).toBe(true);
    expect(isAllowedCjCustomShippingMethod("4PX Standard", "8-14", ["tracked_network"])).toBe(true);
    expect(isAllowedCjCustomShippingMethod("DHL Express Worldwide", "2-5", ["cjpacket_fast"])).toBe(false);
    expect(isAllowedCjCustomShippingMethod("CJPacket Postal", "5-12", ["cjpacket_fast", "express", "tracked_network"])).toBe(false);
    expect(isAllowedCjCustomShippingMethod("YunExpress Special Line", "9-18", ["tracked_network"])).toBe(false);
  });

  it("applies an administrator-selected delivery ceiling without allowing postal methods", () => {
    expect(isAllowedCjCustomShippingMethod("CJPacket Fast Line", "16-20", ["cjpacket_fast"], 30)).toBe(true);
    expect(isAllowedCjCustomShippingMethod("CJPacket Postal", "16-20", ["cjpacket_fast"], 30)).toBe(false);
  });

  it("keeps the manual sourcing limits bounded", () => {
    expect(CJ_CUSTOM_SOURCING_LIMITS.maxRequestedProducts).toBe(12);
    expect(CJ_CUSTOM_SOURCING_LIMITS.maxDraftLimit).toBe(100);
    expect(CJ_CUSTOM_SOURCING_LIMITS.maxFastDeliveryDays).toBe(15);
  });
});
