import { beforeEach, describe, expect, it, vi } from "vitest";

const membershipState = vi.hoisted(() => ({ current: null as { role: string; status: string } | null }));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => membershipState.current),
  getAllProductsAdmin: vi.fn(async () => []),
  getAllCategories: vi.fn(async () => []),
  getDesignProfile: vi.fn(async () => ({ brandName: "Boutique test", navigationItems: [] })),
  getOwnerOrderSummaries: vi.fn(async () => []),
  getOwnerCustomerSummaries: vi.fn(async () => []),
  getOwnerStoreSettingsSummary: vi.fn(async () => ({ currencyCode: "CHF" })),
  getOwnerShippingReturnsSettings: vi.fn(async () => ({ mode: "included", servedCountries: [], returnsSummary: "" })),
  getOwnerStockAlertSettings: vi.fn(async () => ({ lowStockThreshold: 5 })),
  getOwnerLegalContactProfile: vi.fn(async () => ({})),
  getStoreSeoProfile: vi.fn(async () => ({})),
}));

import { appRouter } from "./routers";

function callerFor(role: string = "user") {
  return appRouter.createCaller({
    user: { id: 7, role, name: "Membre test", email: "member@example.test" },
    store: { id: 77, slug: "boutique-test", displayName: "Boutique test", primaryDomain: "boutique.test", status: "active", isPlatformStore: 0 },
  } as any);
}

describe("store-scoped management procedure", () => {
  beforeEach(() => {
    membershipState.current = null;
    vi.clearAllMocks();
  });

  it("authorizes an active manager only within the current client store", async () => {
    membershipState.current = { role: "manager", status: "active" };
    await expect(callerFor().owner.getWorkspace()).resolves.toMatchObject({
      store: { id: 77, displayName: "Boutique test" },
      membership: { role: "manager", status: "active" },
    });
  });

  it("refuses a catalog role from the management workspace", async () => {
    membershipState.current = { role: "catalog_editor", status: "active" };
    await expect(callerFor().owner.getWorkspace()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses an inactive membership even when the global account is an administrator", async () => {
    membershipState.current = { role: "manager", status: "blocked" };
    await expect(callerFor("admin").owner.getWorkspace()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses a global administrator without a client-store membership", async () => {
    await expect(callerFor("admin").owner.getWorkspace()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
