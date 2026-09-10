import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
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

function callerFor(role: "user" | "catalog_editor" | "support_agent" | "order_operator" | "admin") {
  return staffRouter.createCaller({
    user: { id: 7, role, name: "Test", email: "test@mazigho.ch" },
    store: { id: 1, slug: "boutique-ouverte", displayName: "Boutique ouverte", primaryDomain: "ouverte.example.ch", status: "active", isPlatformStore: 0 },
  } as any);
}

describe("staffRouter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("autorise l’éditeur catalogue uniquement sur les brouillons", async () => {
    const caller = callerFor("catalog_editor");
    await expect(caller.catalog.getDrafts()).resolves.toEqual([]);
    await expect(caller.support.getMessages()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.operations.getOrders()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("autorise le service client uniquement sur messages et avis", async () => {
    const caller = callerFor("support_agent");
    await expect(caller.support.getMessages()).resolves.toEqual([]);
    await expect(caller.catalog.getDrafts()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.operations.getOrders()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("autorise l’opérateur commandes uniquement sur le suivi opérationnel", async () => {
    const caller = callerFor("order_operator");
    await expect(caller.operations.getOrders()).resolves.toEqual([]);
    await expect(caller.catalog.getDrafts()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.support.getReviews()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("laisse l’administrateur propriétaire contrôler les trois espaces", async () => {
    const caller = callerFor("admin");
    await expect(caller.catalog.getDrafts()).resolves.toEqual([]);
    await expect(caller.support.getMessages()).resolves.toEqual([]);
    await expect(caller.operations.getOrders()).resolves.toEqual([]);
  });

  it("ferme les espaces collaborateur lorsqu’une boutique est encore en préparation", async () => {
    const caller = staffRouter.createCaller({
      user: { id: 7, role: "catalog_editor", name: "Test", email: "test@mazigho.ch" },
      store: { id: 2, slug: "boutique-setup", displayName: "Boutique en préparation", primaryDomain: "setup.example.ch", status: "setup", isPlatformStore: 0 },
    } as any);
    await expect(caller.catalog.getDrafts()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuse tout accès collaborateur à un compte client", async () => {
    const caller = callerFor("user");
    await expect(caller.catalog.getDrafts()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.support.getMessages()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.operations.getOrders()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
