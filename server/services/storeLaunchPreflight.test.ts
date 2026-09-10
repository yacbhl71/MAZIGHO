import { describe, expect, it } from "vitest";
import { buildStoreLaunchPreflight, suggestStoreSlug } from "./storeLaunchPreflight";

describe("store launch preflight", () => {
  it("prepares a gift storefront without any billing action or activation", () => {
    const preflight = buildStoreLaunchPreflight({
      displayName: "Éclat Atelier",
      requestedDomain: "eclat-atelier.ch",
      status: "draft",
      localReviewReady: true,
      slugExists: false,
      domainExists: false,
      recipientAlreadyHasAccount: false,
    });
    expect(preflight.proposedSlug).toBe("eclat-atelier");
    expect(preflight.proposedStoreStatus).toBe("setup");
    expect(preflight.launchMode).toBe("gift");
    expect(preflight.billingAction).toBe("none");
    expect(preflight.isLocallyReadyForExplicitConfirmation).toBe(true);
    expect(preflight.checks.filter(check => check.state === "pending")).toHaveLength(2);
  });

  it("blocks a preflight when the local store registry has a domain or slug conflict", () => {
    const preflight = buildStoreLaunchPreflight({
      displayName: "Pattes & Compagnie",
      requestedDomain: "pattes.ch",
      status: "draft",
      localReviewReady: true,
      slugExists: true,
      domainExists: true,
      recipientAlreadyHasAccount: true,
    });
    expect(preflight.isLocallyReadyForExplicitConfirmation).toBe(false);
    expect(preflight.blockingChecks).toBe(2);
  });

  it("normalises accents when suggesting a future internal slug", () => {
    expect(suggestStoreSlug("  Bijoux d’Été ! ")).toBe("bijoux-d-ete");
  });
});
