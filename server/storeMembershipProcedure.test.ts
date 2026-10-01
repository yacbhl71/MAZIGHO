import { beforeEach, describe, expect, it, vi } from "vitest";

const membershipState = vi.hoisted(() => ({ current: null as { role: string; status: string } | null }));
const llmState = vi.hoisted(() => ({ answer: "Brouillon de réponse IA" }));
const aiQuotaState = vi.hoisted(() => ({ exhausted: false }));
const conversationState = vi.hoisted(() => ({ messages: [] as Array<{ id: number; role: "user" | "assistant"; content: string; createdAt: Date }> }));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: llmState.answer } }] })),
}));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => membershipState.current),
  getAllProductsAdmin: vi.fn(async () => []),
  getAllCategories: vi.fn(async () => []),
  getDesignProfile: vi.fn(async () => ({ brandName: "Boutique test", navigationItems: [] })),
  getStoreAiUsageSummary: vi.fn(async () => ({ periodKey: "2026-10", planId: "free", limit: 40, used: 0, remaining: 40 })),
  listOwnerKnowledgeDocuments: vi.fn(async () => []),
  getOwnerKnowledgeDocumentContext: vi.fn(async () => []),
  listOwnerAiConversations: vi.fn(async () => [{ id: 51, title: "Discussion privée", messageCount: conversationState.messages.length, createdAt: new Date("2026-10-01T00:00:00Z"), updatedAt: new Date("2026-10-01T00:00:00Z") }]),
  getOwnerAiConversation: vi.fn(async () => ({ conversation: { id: 51, title: "Discussion privée", messageCount: conversationState.messages.length, createdAt: new Date("2026-10-01T00:00:00Z"), updatedAt: new Date("2026-10-01T00:00:00Z") }, messages: conversationState.messages })),
  createOwnerAiConversation: vi.fn(async ({ title }: { title: string }) => ({ id: 51, title, messageCount: 0 })),
  appendOwnerAiConversationMessages: vi.fn(async ({ messages }: { messages: Array<{ role: "user" | "assistant"; content: string }> }) => { conversationState.messages.push(...messages.map((message, index) => ({ id: conversationState.messages.length + index + 1, ...message, createdAt: new Date() }))); return { messageCount: conversationState.messages.length }; }),
  renameOwnerAiConversation: vi.fn(async () => ({ success: true })),
  deleteOwnerAiConversation: vi.fn(async () => ({ success: true })),
  listOwnerAiWorkspaceDocuments: vi.fn(async () => [{ id: 91, kind: "document", title: "Brief privé", createdAt: new Date("2026-10-01T00:00:00Z"), updatedAt: new Date("2026-10-01T00:00:00Z") }]),
  getOwnerAiWorkspaceDocument: vi.fn(async () => ({ id: 91, kind: "document", title: "Brief privé", content: "Contenu privé", createdAt: new Date("2026-10-01T00:00:00Z"), updatedAt: new Date("2026-10-01T00:00:00Z") })),
  createOwnerAiWorkspaceDocument: vi.fn(async () => ({ id: 91, kind: "document", title: "Brief privé", content: "Contenu privé" })),
  updateOwnerAiWorkspaceDocument: vi.fn(async () => ({ success: true })),
  deleteOwnerAiWorkspaceDocument: vi.fn(async () => ({ success: true, kind: "document" })),
  recordAuditLog: vi.fn(async () => undefined),
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
    conversationState.messages = [];
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
  it("keeps the private document center and document context owner-only", async () => {
    membershipState.current = { role: "manager", status: "active" };
    await expect(callerFor().owner.assistant.knowledgeDocuments.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor().owner.assistant.chat({
      messages: [{ role: "user", content: "Utilise mon document privé." }],
      documentIds: [12],
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("allows the active owner to list only its private documents", async () => {
    membershipState.current = { role: "owner", status: "active" };
    await expect(callerFor().owner.assistant.knowledgeDocuments.list()).resolves.toEqual([]);
  });
  it("keeps Workspace conversations owner-only and persists an isolated exchange", async () => {
    membershipState.current = { role: "manager", status: "active" };
    await expect(callerFor().owner.assistant.conversations.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    membershipState.current = { role: "owner", status: "active" };
    await expect(callerFor().owner.assistant.conversations.list()).resolves.toMatchObject([{ id: 51, title: "Discussion privée" }]);
    await expect(callerFor().owner.assistant.conversations.chat({ conversationId: 51, content: "Prépare une FAQ." })).resolves.toMatchObject({ answer: "Brouillon de réponse IA" });
    expect(conversationState.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: "user", content: "Prépare une FAQ." }),
      expect.objectContaining({ role: "assistant", content: "Brouillon de réponse IA" }),
    ]));
  });
  it("keeps Workspace documents owner-only", async () => {
    membershipState.current = { role: "manager", status: "active" };
    await expect(callerFor().owner.assistant.workspaceDocuments.list({ kind: "document" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    membershipState.current = { role: "owner", status: "active" };
    await expect(callerFor().owner.assistant.workspaceDocuments.list({ kind: "document" })).resolves.toMatchObject([{ id: 91, title: "Brief privé" }]);
    await expect(callerFor().owner.assistant.workspaceDocuments.get({ documentId: 91 })).resolves.toMatchObject({ id: 91, content: "Contenu privé" });
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
