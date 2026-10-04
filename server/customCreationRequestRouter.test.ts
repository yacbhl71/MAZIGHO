import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  membership: { role: "owner", status: "active" } as { role: string; status: string } | null,
  created: [] as any[],
  audits: [] as any[],
  ownerUpdates: [] as any[],
}));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => state.membership),
  getStoreCustomCreationRequestSettings: vi.fn(async () => ({ enabled: true, headline: "Une idée ?", intro: "Décrivez votre projet." })),
  saveStoreCustomCreationRequestSettings: vi.fn(async (_storeId: number, input: any) => input),
  createStoreCustomCreationRequest: vi.fn(async (input: any) => {
    state.created.push(input);
    return { id: 321, status: "submitted", createdAt: new Date("2026-10-04T00:00:00.000Z") };
  }),
  getUserStoreCustomCreationRequests: vi.fn(async () => []),
  getOwnerStoreCustomCreationRequests: vi.fn(async () => []),
  updateOwnerStoreCustomCreationRequest: vi.fn(async (input: any) => {
    state.ownerUpdates.push(input);
    return { id: input.requestId, status: input.status, ownerReply: input.ownerReply || null };
  }),
  recordAuditLog: vi.fn(async (input: any) => { state.audits.push(input); }),
}));

import { customCreationRequestRouter } from "./customCreationRequestRouter";

function caller(input?: { status?: "setup" | "active" | "limited"; role?: string; membership?: { role: string; status: string } | null }) {
  state.membership = input?.membership ?? { role: "owner", status: "active" };
  return customCreationRequestRouter.createCaller({
    user: { id: 44, role: input?.role || "user", name: "Client test", email: "client@example.test" },
    store: { id: 77, slug: "atelier-test", displayName: "Atelier test", primaryDomain: "atelier.test", status: input?.status || "active", isPlatformStore: 0 },
  } as any);
}

describe("customCreationRequestRouter", () => {
  beforeEach(() => {
    state.membership = { role: "owner", status: "active" };
    state.created = [];
    state.audits = [];
    state.ownerUpdates = [];
    vi.clearAllMocks();
  });

  it("creates a brief only in the resolved storefront and logs no customer text", async () => {
    const result = await caller().create({
      kind: "portrait",
      title: "Portrait de famille",
      description: "Un portrait chaleureux au crayon avec trois personnes.",
      budget: "80 CHF",
    });
    expect(result).toMatchObject({ id: 321, status: "submitted" });
    expect(state.created).toEqual([expect.objectContaining({ storeId: 77, userId: 44, kind: "portrait" })]);
    expect(state.audits).toEqual([expect.objectContaining({ storeId: 77, entityId: 321, metadata: { kind: "portrait" } })]);
    expect(JSON.stringify(state.audits)).not.toContain("Portrait de famille");
  });

  it("does not expose the workflow on a setup boutique", async () => {
    await expect(caller({ status: "setup" }).getAvailability()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps owner updates within the active store membership", async () => {
    await caller().owner.update({ requestId: 12, status: "answered", ownerReply: "Projet réalisable après validation." });
    expect(state.ownerUpdates).toEqual([expect.objectContaining({ storeId: 77, requestId: 12, actorUserId: 44, status: "answered" })]);
  });

  it("rejects non-manager members from the internal queue", async () => {
    await expect(caller({ membership: { role: "catalog_editor", status: "active" } }).owner.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
