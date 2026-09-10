import { describe, expect, it } from "vitest";
import { reviewStoreProvisioningDraft } from "./storeProvisioningReview";

const completeDraft = {
  displayName: "Éclat Atelier",
  requestedDomain: "eclat-atelier.ch",
  ownerName: "Camille Martin",
  ownerEmail: "camille@example.ch",
  businessType: "bijoux" as const,
  preferredCurrency: "CHF",
  status: "draft" as const,
};

describe("store provisioning review", () => {
  it("marks a locally complete draft as ready for confirmation without pretending to verify the domain", () => {
    const review = reviewStoreProvisioningDraft(completeDraft, 1);
    expect(review.readiness).toBe("ready_for_confirmation");
    expect(review.blockingChecks).toBe(0);
    expect(review.checks.find(check => check.key === "external_launch_checks")).toMatchObject({ state: "pending" });
  });

  it("requires attention for incomplete local details", () => {
    const review = reviewStoreProvisioningDraft({ ...completeDraft, displayName: "", ownerEmail: "invalid", requestedDomain: "https://bad.example" }, 1);
    expect(review.readiness).toBe("needs_attention");
    expect(review.blockingChecks).toBeGreaterThanOrEqual(3);
  });

  it("requires a custom theme when another universe is selected", () => {
    const missingTheme = reviewStoreProvisioningDraft({ ...completeDraft, businessType: "autre" }, 1);
    expect(missingTheme.readiness).toBe("needs_attention");
    expect(missingTheme.checks.find(check => check.key === "business")).toMatchObject({ state: "attention" });

    const themed = reviewStoreProvisioningDraft({ ...completeDraft, businessType: "autre", customBusinessTheme: "Décoration artisanale" }, 1);
    expect(themed.checks.find(check => check.key === "business")).toMatchObject({ state: "complete" });
  });

  it("flags a duplicate domain only inside the local draft queue", () => {
    const review = reviewStoreProvisioningDraft(completeDraft, 2);
    expect(review.readiness).toBe("needs_attention");
    expect(review.checks.find(check => check.key === "local_domain_conflict")).toMatchObject({ state: "attention" });
  });
});
