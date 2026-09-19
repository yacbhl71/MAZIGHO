import { beforeEach, describe, expect, it, vi } from "vitest";

const membershipState = vi.hoisted(() => ({ current: null as { role: string; status: string } | null }));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => membershipState.current),
  getCatalogCategoriesForEditor: vi.fn(async () => []),
  getCatalogDraftsForEditor: vi.fn(async () => []),
  createCatalogDraft: vi.fn(async () => ({ id: 1 })),
  updateCatalogDraft: vi.fn(async () => ({ success: true })),
  deleteCatalogDraft: vi.fn(async () => ({ success: true })),
  getAllMessagesAdmin: vi.fn(async () => []),
  updateMessageStatus: vi.fn(async () => ({ success: true })),
  getAllReviewsAdmin: vi.fn(async () => []),
  updateReviewStatus: vi.fn(async () => ({ success: true })),
  getOperationalOrders: vi.fn(async () => []),
  getOperationalOrderItems: vi.fn(async () => []),
  updateOperationalOrderTracking: vi.fn(async () => ({ success: true })),
}));

import { staffRouter } from "./staffRouter";

function callerForPlatform(role: "user" | "catalog_editor" | "support_agent" | "order_operator" | "admin") {
  return staffRouter.createCaller({
    user: { id: 7, role, name: "Test", email: "test@mazigho.ch" },
    store: { id: 1, slug: "mazigho", displayName: "MAZIGHO", primaryDomain: "mazigho.example.ch", status: "active", isPlatformStore: 1 },
  } as any);
}

function callerForClientStore(userRole: "user" | "admin" = "user", status: "active" | "setup" = "active") {
  return staffRouter.createCaller({
    user: { id: 7, role: userRole, name: "Test", email: "test@mazigho.ch" },
    store: { id: 2, slug: "boutique-cliente", displayName: "Boutique cliente", primaryDomain: "client.example.ch", status, isPlatformStore: 0 },
  } as any);
}

describe("staffRouter", () => {
  beforeEach(() => {
    membershipState.current = null;
    vi.clearAllMocks();
  });

  it("keeps existing platform staff missions separated", async () => {
    const caller = callerForPlatform("catalog_editor");
    await expect(caller.catalog.getDrafts()).resolves.toEqual([]);
    await expect(caller.support.getMessages()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.operations.getOrders()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps platform support and operations missions separated", async () => {
    const support = callerForPlatform("support_agent");
    await expect(support.support.getMessages()).resolves.toEqual([]);
    await expect(support.catalog.getDrafts()).rejects.toMatchObject({ code: "FORBIDDEN" });

    const operations = callerForPlatform("order_operator");
    await expect(operations.operations.getOrders()).resolves.toEqual([]);
    await expect(operations.support.getReviews()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an active client-store catalog editor only in the catalog mission", async () => {
    membershipState.current = { role: "catalog_editor", status: "active" };
    const caller = callerForClientStore();
    await expect(caller.catalog.getDrafts()).resolves.toEqual([]);
    await expect(caller.support.getMessages()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.operations.getOrders()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an active client-store manager across the operational missions of that boutique", async () => {
    membershipState.current = { role: "manager", status: "active" };
    const caller = callerForClientStore();
    await expect(caller.catalog.getDrafts()).resolves.toEqual([]);
    await expect(caller.support.getMessages()).resolves.toEqual([]);
    await expect(caller.operations.getOrders()).resolves.toEqual([]);
  });

  it("refuses a global administrator on a client store without an active membership", async () => {
    await expect(callerForClientStore("admin").catalog.getDrafts()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("closes client-staff spaces while a boutique is in preparation", async () => {
    membershipState.current = { role: "catalog_editor", status: "active" };
    await expect(callerForClientStore("user", "setup").catalog.getDrafts()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
