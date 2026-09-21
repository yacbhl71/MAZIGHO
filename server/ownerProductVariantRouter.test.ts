import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  membership: { role: "manager", status: "active" } as { role: string; status: string } | null,
  variants: [{ id: 5, label: "Bleu · M", sku: "BLEU-M", priceAdjustmentCents: 250, stock: 3, status: "active", displayOrder: 0 }],
  team: [{ membershipId: 9, role: "manager", status: "active", name: "Manager test", email: "manager@example.test", accountStatus: "active" }],
}));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => state.membership),
  getStoreTeamMembers: vi.fn(async () => state.team),
  prepareStoreTeamInvitation: vi.fn(async () => ({
    userId: 15,
    name: "Éditeur test",
    email: "editeur@example.test",
    role: "catalog_editor",
    activation: { token: "one-time-token", expiresAt: new Date("2026-12-01T00:00:00.000Z") },
  })),
  getOwnerProductVariants: vi.fn(async () => state.variants),
  createOwnerProductVariant: vi.fn(async () => ({ id: 6 })),
  updateOwnerProductVariant: vi.fn(async () => ({ success: true })),
  deleteOwnerProductVariant: vi.fn(async () => ({ success: true })),
}));

import * as db from "./db";
import { appRouter } from "./routers";

function callerFor(role: string = "user") {
  return appRouter.createCaller({
    user: { id: 7, role, name: "Manager test", email: "manager@example.test" },
    store: { id: 77, slug: "boutique-test", displayName: "Boutique test", primaryDomain: "boutique.test", status: "active", isPlatformStore: 0 },
  } as any);
}

describe("owner product variant routes", () => {
  beforeEach(() => {
    state.membership = { role: "manager", status: "active" };
    vi.clearAllMocks();
  });

  it("reads and writes variants only through the current resolved store", async () => {
    const caller = callerFor();
    await expect(caller.owner.getProductVariants({ productId: 41 })).resolves.toEqual(state.variants);
    expect(db.getOwnerProductVariants).toHaveBeenCalledWith(41, 77);

    await expect(caller.owner.createProductVariant({
      productId: 41,
      variant: { label: "Sauge · L", sku: "SAUGE-L", priceAdjustmentCents: 0, stock: 4, status: "active" },
    })).resolves.toEqual({ id: 6 });
    expect(db.createOwnerProductVariant).toHaveBeenCalledWith(41, expect.objectContaining({ label: "Sauge · L", stock: 4 }), 77);
  });

  it("refuses a catalog-only membership from the variant management procedures", async () => {
    state.membership = { role: "catalog_editor", status: "active" };
    await expect(callerFor().owner.getProductVariants({ productId: 41 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor().owner.deleteProductVariant({ productId: 41, variantId: 5 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lists only the team attached to the current resolved store", async () => {
    await expect(callerFor().owner.getTeam()).resolves.toEqual(state.team);
    expect(db.getStoreTeamMembers).toHaveBeenCalledWith(77);

    state.membership = { role: "catalog_editor", status: "active" };
    await expect(callerFor().owner.getTeam()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows only the owner to prepare a scoped team invitation", async () => {
    state.membership = { role: "owner", status: "active" };
    const input = { name: "Éditeur test", email: "editeur@example.test", role: "catalog_editor" as const, confirmationEmail: "editeur@example.test" };
    await expect(callerFor().owner.prepareTeamInvitation(input)).resolves.toMatchObject({
      userId: 15,
      activationLink: expect.stringContaining("token=one-time-token"),
      emailSent: false,
    });
    expect(db.prepareStoreTeamInvitation).toHaveBeenCalledWith(expect.objectContaining({ storeId: 77, role: "catalog_editor" }));

    state.membership = { role: "manager", status: "active" };
    await expect(callerFor().owner.prepareTeamInvitation(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
