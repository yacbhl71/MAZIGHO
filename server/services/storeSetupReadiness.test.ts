import { describe, expect, it } from "vitest";
import { buildStoreSetupReadiness } from "./storeSetupReadiness";

const readyBase = {
  status: "setup" as const,
  isGiftProvisioned: true,
  businessType: "bijoux" as const,
  hasActiveOwner: true,
  hasOwnDesignProfile: true,
  brandName: "Éclat Atelier",
  hasOwnLegalProfile: true,
  categoryCount: 3,
  activeProductCount: 1,
  hasCurrency: true,
};

describe("buildStoreSetupReadiness", () => {
  it("reports a private ready state for a supported setup boutique without opening it publicly", () => {
    const readiness = buildStoreSetupReadiness(readyBase);

    expect(readiness.privatePreviewUsable).toBe(true);
    expect(readiness.publicStorefront).toBe(false);
    expect(readiness.blockedCount).toBe(0);
    expect(readiness.checks.find(check => check.key === "business_type")).toMatchObject({ state: "ready" });
    expect(readiness.checks.find(check => check.key === "public_opening")).toMatchObject({ state: "manual" });
  });

  it("does not treat an unsupported universe or a non-setup store as private-preview ready", () => {
    const readiness = buildStoreSetupReadiness({
      ...readyBase,
      status: "active",
      businessType: "autre",
    });

    expect(readiness.privatePreviewUsable).toBe(false);
    expect(readiness.publicStorefront).toBe(false);
    expect(readiness.blockedCount).toBeGreaterThanOrEqual(2);
    expect(readiness.checks.find(check => check.key === "store_status")).toMatchObject({ state: "blocked" });
    expect(readiness.checks.find(check => check.key === "business_type")).toMatchObject({ state: "blocked" });
  });

  it("keeps legal and owner gaps as manual preparation items without exposing their details", () => {
    const readiness = buildStoreSetupReadiness({
      ...readyBase,
      hasActiveOwner: false,
      hasOwnLegalProfile: false,
    });

    expect(readiness.checks.find(check => check.key === "owner")).toMatchObject({ state: "manual" });
    expect(readiness.checks.find(check => check.key === "legal")).toMatchObject({ state: "manual" });
  });
});
