import { describe, expect, it } from "vitest";
import { buildStoreOpeningReadiness } from "./storeOpeningReadiness";

const readyItems = [
  { id: "vitrine", label: "Vitrine", ready: true },
  { id: "catalogue", label: "Catalogue", ready: true },
  { id: "operations", label: "Livraison", ready: true },
  { id: "public_view", label: "Vitrine publique", ready: false },
] as const;

describe("store opening readiness", () => {
  it("requires only existing local controls before Studio review", () => {
    const result = buildStoreOpeningReadiness({ status: "setup", items: readyItems });

    expect(result).toMatchObject({
      state: "ready_for_studio_review",
      preOpeningCompleted: 3,
      preOpeningTotal: 3,
      localRequirementsComplete: true,
      publicActivationExecuted: false,
      paymentActivationExecuted: false,
    });
    expect(result.incompleteItems).toEqual([]);
  });

  it("lists incomplete local controls without treating the closed public view as a blocker", () => {
    const result = buildStoreOpeningReadiness({
      status: "setup",
      items: [{ id: "catalogue", label: "Catalogue", ready: false }, ...readyItems.slice(1)],
    });

    expect(result.state).toBe("action_required");
    expect(result.incompleteItems).toEqual([{ id: "catalogue", label: "Catalogue" }]);
  });

  it("keeps owner declarations visible without using them as a technical opening blocker", () => {
    const result = buildStoreOpeningReadiness({
      status: "setup",
      items: [...readyItems, { id: "legal", label: "Informations légales", ready: false, openingBlocking: false }],
    });

    expect(result.localRequirementsComplete).toBe(true);
    expect(result.preOpeningTotal).toBe(3);
    expect(result.incompleteItems).toEqual([]);
  });

  it("recognizes an already active public storefront without implying a payment activation", () => {
    const result = buildStoreOpeningReadiness({
      status: "active",
      items: readyItems.map(item => item.id === "public_view" ? { ...item, ready: true } : item),
    });

    expect(result).toMatchObject({
      state: "opened",
      publicActivationExecuted: true,
      paymentActivationExecuted: false,
    });
  });

  it("keeps non-opening lifecycle states outside the review path", () => {
    expect(buildStoreOpeningReadiness({ status: "limited", items: readyItems }).state).toBe("unavailable");
  });
});
