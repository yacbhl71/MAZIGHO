import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  desk: {
    stage: "new_project",
    notes: "",
    reminders: [],
    handover: { owner_access: false, store_identity: false, catalogue: false, operations: false, domain: false },
    updatedAt: "2026-10-04T20:00:00.000Z",
  },
}));

vi.mock("./db", () => ({
  getStudioStoreProjectDesk: vi.fn(async (storeId: number) => ({ store: { id: storeId, displayName: "Boutique test", primaryDomain: "boutique.test", status: "active" }, desk: state.desk })),
  saveStudioStoreProjectDesk: vi.fn(async (input) => ({ store: { id: input.storeId, displayName: "Boutique test", primaryDomain: "boutique.test" }, desk: input.desk })),
  recordAuditLog: vi.fn(async () => undefined),
}));

import * as db from "./db";
import { adminRouter } from "./adminRouter";

function callerFor(role = "admin") {
  return adminRouter.createCaller({
    user: { id: 7, role, name: "Opérateur", email: "operator@example.test" },
    store: { id: 1, slug: "primary", displayName: "MAZIGHO", primaryDomain: "mazigho.test", status: "active", isPlatformStore: 1 },
  } as any);
}

describe("Studio project desk routes", () => {
  it("reads and saves only the explicitly targeted store for a platform operator", async () => {
    const caller = callerFor();
    await expect(caller.studio.getStoreProjectDesk({ storeId: 77 })).resolves.toEqual({ store: expect.any(Object), desk: state.desk });
    expect(db.getStudioStoreProjectDesk).toHaveBeenCalledWith(77);

    await expect(caller.studio.saveStoreProjectDesk({
      storeId: 77,
      desk: {
        stage: "to_prepare",
        notes: "Préparer le catalogue.",
        reminders: [{ id: "reminder_12345", title: "Relire", dueDate: "2026-10-10", completed: false, createdAt: "2026-10-04T20:00:00.000Z" }],
        handover: { owner_access: false, store_identity: true, catalogue: false, operations: false, domain: false },
      },
    })).resolves.toMatchObject({ store: { id: 77 }, desk: { stage: "to_prepare" } });
    expect(db.saveStudioStoreProjectDesk).toHaveBeenCalledWith(expect.objectContaining({ storeId: 77, desk: expect.objectContaining({ notes: "Préparer le catalogue." }) }));
    expect(db.recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({ entityId: 77, action: "studio.store.project_desk.save", metadata: expect.objectContaining({ noteStoredEncrypted: true, emailSent: false }) }));
  });

  it("does not expose the Studio desk to a non-platform role", async () => {
    await expect(callerFor("user").studio.getStoreProjectDesk({ storeId: 77 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
