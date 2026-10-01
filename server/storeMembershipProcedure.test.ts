import { beforeEach, describe, expect, it, vi } from "vitest";

const membershipState = vi.hoisted(() => ({ current: null as { role: string; status: string } | null }));
const llmState = vi.hoisted(() => ({ answer: "Brouillon de réponse IA" }));
const aiQuotaState = vi.hoisted(() => ({ exhausted: false }));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: llmState.answer } }] })),
}));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => membershipState.current),
  getAllProductsAdmin: vi.fn(async () => []),
  getAllCategories: vi.fn(async () => []),
  getDesignProfile: vi.fn(async () => ({ brandName: "Boutique test", navigationItems: [] })),
  getStoreAiUsageSummary: vi.fn(async () => ({ periodKey: "2026-10", planId: "free", limit: 40, used: 0, remaining: 40 })),
  reserveStoreAiRequest: vi.fn(async () => {
    if (aiQuotaState.exhausted) throw new Error("AI_MONTHLY_REQUEST_LIMIT_REACHED");
    return { periodKey: "2026-10", planId: "free", limit: 40, used: 1, remaining: 39 };
  }),
  getOwnerOrderSummaries: vi.fn(async () => []),
  getOwnerCustomerSummaries: vi.fn(async () => []),
  getOwnerStoreSettingsSummary: vi.fn(async () => ({ currencyCode: "CHF" })),
  getOwnerShippingReturnsSettings: vi.fn(async () => ({ mode: "included", servedCountries: [], returnsSummary: "" })),
  getOwnerStockAlertSettings: vi.fn(async () => ({ lowStockThreshold: 5 })),
  getOwnerLegalContactProfile: vi.fn(async () => ({})),
  getStoreSeoProfile: vi.fn(async () => ({})),
}));

import { appRouter } from "./routers";

function callerFor(role: string = "user", status: "setup" | "active" = "active", setupOwnerPanel = false) {
  return appRouter.createCaller({
    user: { id: 7, role, name: "Membre test", email: "member@example.test" },
    store: { id: 77, slug: "boutique-test", displayName: "Boutique test", primaryDomain: "boutique.test", status, isPlatformStore: 0 },
    setupOwnerPanel,
  } as any);
}

function platformAdminCaller() {
  return appRouter.createCaller({
    user: { id: 1, role: "admin", name: "Administrateur plateforme", email: "admin@example.test" },
    store: { id: 1, slug: "primary-store", displayName: "MAZIGHO", primaryDomain: "mazigho.ch", status: "active", isPlatformStore: 1 },
  } as any);
}

describe("store-scoped management procedure", () => {
  beforeEach(() => {
    membershipState.current = null;
    aiQuotaState.exhausted = false;
    vi.clearAllMocks();
  });

  it("authorizes an active manager only within the current client store", async () => {
    membershipState.current = { role: "manager", status: "active" };
    await expect(callerFor().owner.getWorkspace()).resolves.toMatchObject({
      store: { id: 77, displayName: "Boutique test" },
      membership: { role: "manager", status: "active" },
    });
  });

  it("keeps the AI assistant scoped to an active store manager", async () => {
    membershipState.current = { role: "manager", status: "active" };
    await expect(callerFor().owner.assistant.chat({
      messages: [{ role: "user", content: "Améliore mon texte d’accueil." }],
    })).resolves.toMatchObject({ answer: "Brouillon de réponse IA", usage: { planId: "free", used: 1, remaining: 39 } });
  });
  it("refuses an exhausted quota before calling the assistant model", async () => {
    membershipState.current = { role: "manager", status: "active" };
    aiQuotaState.exhausted = true;
    await expect(callerFor().owner.assistant.chat({
      messages: [{ role: "user", content: "Prépare une fiche produit." }],
    })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS", message: expect.stringMatching(/quota mensuel/i) });
  });
  it("allows the platform administrator to operate the primary MAZIGHO store without a tenant membership", async () => {
    await expect(platformAdminCaller().owner.getWorkspace()).resolves.toMatchObject({
      store: { id: 1, displayName: "MAZIGHO" },
      membership: { role: "owner", status: "active" },
    });
    await expect(platformAdminCaller().owner.assistant.chat({
      messages: [{ role: "user", content: "Prépare une idée de page d’accueil." }],
    })).resolves.toMatchObject({ answer: "Brouillon de réponse IA", usage: { planId: "free" } });
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

  it("allows an active owner membership to prepare its setup boutique only through the verified platform panel", async () => {
    membershipState.current = { role: "owner", status: "active" };
    await expect(callerFor("user", "setup", true).owner.getWorkspace()).resolves.toMatchObject({
      store: { id: 77, status: "setup" },
      membership: { role: "owner", status: "active" },
    });
  });

  it("keeps a setup boutique closed when the verified setup panel context is absent", async () => {
    membershipState.current = { role: "owner", status: "active" };
    await expect(callerFor("user", "setup", false).owner.getWorkspace()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
