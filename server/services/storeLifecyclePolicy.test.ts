import { describe, expect, it } from "vitest";
import { assessStudioStoreLifecycleTransition } from "./storeLifecyclePolicy";

describe("assessStudioStoreLifecycleTransition", () => {
  it("protects the MAZIGHO platform storefront from lifecycle changes", () => {
    expect(assessStudioStoreLifecycleTransition({ currentStatus: "active", nextStatus: "suspended", isPlatformStore: true }))
      .toEqual({ allowed: false, reason: "PLATFORM_STORE_PROTECTED" });
  });

  it("keeps setup activation behind the dedicated confirmation preflight", () => {
    expect(assessStudioStoreLifecycleTransition({ currentStatus: "setup", nextStatus: "active", isPlatformStore: false }))
      .toEqual({ allowed: false, reason: "SETUP_REQUIRES_ACTIVATION_PREFLIGHT" });
    expect(assessStudioStoreLifecycleTransition({ currentStatus: "active", nextStatus: "setup", isPlatformStore: false }))
      .toEqual({ allowed: false, reason: "SETUP_REQUIRES_ACTIVATION_PREFLIGHT" });
  });

  it("allows an explicit reversible access-state transition for a live client store", () => {
    expect(assessStudioStoreLifecycleTransition({ currentStatus: "active", nextStatus: "limited", isPlatformStore: false }))
      .toEqual({ allowed: true });
    expect(assessStudioStoreLifecycleTransition({ currentStatus: "suspended", nextStatus: "active", isPlatformStore: false }))
      .toEqual({ allowed: true });
    expect(assessStudioStoreLifecycleTransition({ currentStatus: "closed", nextStatus: "limited", isPlatformStore: false }))
      .toEqual({ allowed: true });
  });

  it("does not record an empty status change", () => {
    expect(assessStudioStoreLifecycleTransition({ currentStatus: "limited", nextStatus: "limited", isPlatformStore: false }))
      .toEqual({ allowed: false, reason: "NO_STATUS_CHANGE" });
  });
});
