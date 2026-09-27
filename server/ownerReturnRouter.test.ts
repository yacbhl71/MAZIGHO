import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  membership: { role: "manager", status: "active" } as { role: string; status: string } | null,
}));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => state.membership),
  getOwnerReturnRequests: vi.fn(async storeId => [{ id: 81, storeId, orderId: 41, status: "requested", items: [], events: [] }]),
  updateOwnerReturnRequest: vi.fn(async input => ({ success: true, orderId: 41, status: "approved", label: "instructions de retour enregistrées", ...input })),
  recordAuditLog: vi.fn(async () => undefined),
}));

import * as db from "./db";
import { appRouter } from "./routers";

function callerFor(role = "user", storeId = 77) {
  return appRouter.createCaller({
    user: { id: 7, role, name: "Manager test", email: "manager@example.test" },
    store: { id: storeId, slug: "boutique-test", displayName: "Boutique test", primaryDomain: "boutique.test", status: "active", isPlatformStore: 0 },
  } as any);
}

describe("owner controlled returns", () => {
  beforeEach(() => {
    state.membership = { role: "manager", status: "active" };
    vi.clearAllMocks();
  });

  it("reads and updates return requests through the current store only", async () => {
    await expect(callerFor("user", 77).owner.getReturnRequests()).resolves.toMatchObject([{ storeId: 77 }]);
    expect(db.getOwnerReturnRequests).toHaveBeenCalledWith(77);

    await expect(callerFor("user", 77).owner.updateReturnRequest({ id: 81, action: "approve", note: "Retournez les articles avec le numéro de commande." })).resolves.toMatchObject({ status: "approved" });
    expect(db.updateOwnerReturnRequest).toHaveBeenCalledWith(expect.objectContaining({ id: 81, action: "approve", actorUserId: 7, storeId: 77 }));
  });

  it("refuses a non-management membership even for a globally privileged account", async () => {
    state.membership = { role: "catalog_editor", status: "active" };
    await expect(callerFor("admin").owner.getReturnRequests()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
