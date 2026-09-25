import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getPublicLegalProfile: vi.fn(async (storeId?: number) => ({
    operatorName: `Boutique ${storeId}`,
    country: "Suisse",
    contactEmail: "contact@example.test",
    businessStatus: "Entreprise individuelle",
    ideVatNumber: "IDE CHE-123.456.789",
    deliveryZones: "Suisse",
    deliveryDetails: "Selon conditions affichées.",
    returnsPolicy: "À confirmer.",
  })),
}));

vi.mock("./db", () => ({
  getPublicLegalProfile: state.getPublicLegalProfile,
}));

import { appRouter } from "./routers";

function storefrontCaller(storeId = 77) {
  return appRouter.createCaller({
    user: null,
    store: { id: storeId, slug: "boutique-test", displayName: "Boutique test", primaryDomain: "boutique.test", status: "active", isPlatformStore: 0 },
  } as any);
}

describe("public legal profile", () => {
  it("returns only the current storefront's public legal contact data", async () => {
    const profile = await storefrontCaller().legal.get();

    expect(state.getPublicLegalProfile).toHaveBeenCalledWith(77);
    expect(profile).toMatchObject({ operatorName: "Boutique 77", contactEmail: "contact@example.test" });
    expect(profile).not.toHaveProperty("addressLine");
    expect(profile).not.toHaveProperty("postalCodeCity");
  });
});
