import { describe, expect, it } from "vitest";
import { getOwnerStoreStatusPresentation } from "../shared/ownerStoreStatus";

describe("getOwnerStoreStatusPresentation", () => {
  it("presents every store lifecycle state without exposing a mutation", () => {
    expect(getOwnerStoreStatusPresentation("setup")).toMatchObject({ label: "En préparation", tone: "amber" });
    expect(getOwnerStoreStatusPresentation("active")).toMatchObject({ label: "Boutique active", tone: "emerald" });
    expect(getOwnerStoreStatusPresentation("limited")).toMatchObject({ label: "Accès limité", tone: "amber" });
    expect(getOwnerStoreStatusPresentation("suspended")).toMatchObject({ label: "Boutique suspendue", tone: "rose" });
    expect(getOwnerStoreStatusPresentation("closed")).toMatchObject({ label: "Boutique fermée", tone: "slate" });
  });

  it("falls back safely to the preparation state for an unexpected status", () => {
    expect(getOwnerStoreStatusPresentation("unexpected")).toMatchObject({ label: "En préparation", tone: "amber" });
  });
});
