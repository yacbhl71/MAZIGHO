import { describe, expect, it } from "vitest";
import {
  acquisitionPlanId,
  getPublicStoreAcquisitionPlan,
  isPublicStoreAcquisitionPlanId,
  publicStoreAcquisitionPlanIds,
} from "../shared/storeAcquisition";
import { storeAcquisitionRequestSchema } from "./storeAcquisitionRouter";

describe("public store acquisition offers", () => {
  it("exposes exactly the three official offers shown on the acquisition wizard", () => {
    expect(publicStoreAcquisitionPlanIds).toEqual(["free", "basic", "pro"]);
    expect(getPublicStoreAcquisitionPlan("free").name).toBe("FREE");
    expect(getPublicStoreAcquisitionPlan("basic").name).toBe("BASIC");
    expect(getPublicStoreAcquisitionPlan("pro").name).toBe("PRO");
  });

  it("never accepts the Studio-only LIFETIME snapshot in the public flow", () => {
    expect(isPublicStoreAcquisitionPlanId("lifetime")).toBe(false);
    expect(isPublicStoreAcquisitionPlanId("LIFETIME")).toBe(false);
    expect(acquisitionPlanId("lifetime")).toBe("free");
  });

  it("keeps the visible pricing grid aligned with the requested plan identifiers", () => {
    expect(acquisitionPlanId("FREE")).toBe("free");
    expect(acquisitionPlanId("BASIC")).toBe("basic");
    expect(acquisitionPlanId("PRO")).toBe("pro");
  });

  it("rejects Studio-only offers and malformed public subdomains before writing a draft", () => {
    const request = {
      requestedPlan: "basic",
      displayName: "Atelier Étoile",
      requestedSubdomain: "atelier-etoile",
      businessType: "autre" as const,
      customBusinessTheme: "Objets artisanaux",
      provisioningTemplate: "standard" as const,
      preferredCurrency: "CHF" as const,
      acknowledged: true as const,
    };
    expect(storeAcquisitionRequestSchema.safeParse(request).success).toBe(true);
    expect(storeAcquisitionRequestSchema.safeParse({ ...request, requestedPlan: "lifetime" }).success).toBe(false);
    expect(storeAcquisitionRequestSchema.safeParse({ ...request, requestedSubdomain: "http://bad" }).success).toBe(false);
  });
});
