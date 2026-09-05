import { describe, expect, it } from "vitest";
import { isCjSandboxQueueLineEligible } from "./cjOrderEligibility";

const validSnapshot = JSON.stringify({
  version: 1,
  provider: "CJdropshipping",
  supplierProductId: "CJ-123",
  supplierVariantId: "VID-ORANGE-M",
  countryCode: "CH",
});

describe("CJ sandbox queue eligibility", () => {
  it("accepts a server-resolved CJ variant for a selected option combination", () => {
    expect(isCjSandboxQueueLineEligible({
      selectedOptions: JSON.stringify({ Couleur: "Orange", Taille: "M" }),
      supplierSnapshot: validSnapshot,
    })).toBe(true);
  });

  it("accepts a simple product with no selected options", () => {
    expect(isCjSandboxQueueLineEligible({
      selectedOptions: "{}",
      supplierSnapshot: validSnapshot,
    })).toBe(true);
  });

  it("rejects a malformed option selection or incomplete supplier snapshot", () => {
    expect(isCjSandboxQueueLineEligible({
      selectedOptions: "not-json",
      supplierSnapshot: validSnapshot,
    })).toBe(false);
    expect(isCjSandboxQueueLineEligible({
      selectedOptions: JSON.stringify({ Couleur: "Orange" }),
      supplierSnapshot: JSON.stringify({ provider: "CJdropshipping", supplierProductId: "CJ-123", countryCode: "CH" }),
    })).toBe(false);
  });
});
