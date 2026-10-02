import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  error: "" as string,
  captured: null as Record<string, unknown> | null,
}));

vi.mock("./db", () => ({
  createReturnRequest: vi.fn(async (input: Record<string, unknown>) => {
    state.captured = input;
    if (state.error) throw new Error(state.error);
    return { id: 301 };
  }),
  getUserReturnRequests: vi.fn(async () => []),
  getStoreReturnRequestAvailability: vi.fn(async () => ({ enabled: true })),
  getUserOrders: vi.fn(async () => []),
  getOrderDetail: vi.fn(async () => null),
  getStoreMaintenanceMode: vi.fn(async () => ({ enabled: false, title: "Retour bientôt", message: "La boutique est en pause." })),
}));

import * as db from "./db";
import { appRouter } from "./routers";

function callerFor(storeId = 77, userId = 7) {
  return appRouter.createCaller({
    user: { id: userId, role: "user", name: "Client test", email: "client@example.test" },
    store: { id: storeId, slug: `boutique-${storeId}`, displayName: "Boutique test", primaryDomain: "boutique.test", status: "active", isPlatformStore: 0 },
  } as any);
}

describe("shop return requests", () => {
  beforeEach(() => {
    state.error = "";
    state.captured = null;
    vi.clearAllMocks();
  });

  it("binds a selected-item return request to the resolved storefront only", async () => {
    await expect(callerFor(77, 7).shop.orders.requestReturn({
      orderId: 42,
      reason: "Article reçu endommagé.",
      items: [{ orderItemId: 12, quantity: 1 }],
    })).resolves.toEqual({ id: 301 });

    expect(db.createReturnRequest).toHaveBeenCalledWith({
      userId: 7,
      orderId: 42,
      reason: "Article reçu endommagé.",
      items: [{ orderItemId: 12, quantity: 1 }],
      storeId: 77,
    });
    expect(state.captured?.storeId).toBe(77);
  });

  it("reports the store-scoped return availability", async () => {
    await expect(callerFor(77).shop.orders.getReturnRequestAvailability()).resolves.toEqual({ enabled: true });
    expect(db.getStoreReturnRequestAvailability).toHaveBeenCalledWith(77);
  });

  it("refuses a return request when the resolved store has disabled the customer flow", async () => {
    state.error = "RETURN_REQUESTS_DISABLED";
    await expect(callerFor(77).shop.orders.requestReturn({
      orderId: 42,
      reason: "La boutique doit encore activer ce parcours.",
      items: [{ orderItemId: 12, quantity: 1 }],
    })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Les demandes de retour en ligne ne sont pas activées pour cette boutique." });
  });

  it("does not reveal a cross-store order as a valid return target", async () => {
    state.error = "ORDER_NOT_FOUND";
    await expect(callerFor(77).shop.orders.requestReturn({
      orderId: 999,
      reason: "Commande provenant d’une autre boutique.",
      items: [{ orderItemId: 55, quantity: 1 }],
    })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects an empty item selection before reaching persistence", async () => {
    await expect(callerFor().shop.orders.requestReturn({
      orderId: 42,
      reason: "Aucun article sélectionné.",
      items: [],
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.createReturnRequest).not.toHaveBeenCalled();
  });
});
