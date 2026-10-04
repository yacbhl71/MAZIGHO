import { describe, expect, it } from "vitest";
import { isSafeOwnerManualTrackingUrl } from "../shared/ownerManualTracking";

describe("owner manual tracking", () => {
  it("accepts an empty value or a standard HTTP(S) tracking address", () => {
    expect(isSafeOwnerManualTrackingUrl("")).toBe(true);
    expect(isSafeOwnerManualTrackingUrl("https://carrier.example/track/AB-123")).toBe(true);
    expect(isSafeOwnerManualTrackingUrl("http://carrier.example/track/AB-123")).toBe(true);
  });

  it("rejects executable, local or malformed tracking addresses", () => {
    expect(isSafeOwnerManualTrackingUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeOwnerManualTrackingUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeOwnerManualTrackingUrl("carrier.example/track/AB-123")).toBe(false);
  });

});
