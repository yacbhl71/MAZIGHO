import { beforeEach, describe, expect, it, vi } from "vitest";

const membershipState = vi.hoisted(() => ({ current: null as { role: string; status: string } | null }));
const pagesState = vi.hoisted(() => ({
  current: {
    faq: [] as Array<{ id: string; question: string; answer: string }>,
    contact: null as null | { title: string; intro: string; email: string; phone: string; address: string; hours: string },
    returns: null as null | { title: string; body: string },
    about: null as null | { title: string; body: string },
  },
  upserts: [] as Array<{ pageId: string; payload: unknown }>,
}));

vi.mock("./db", () => ({
  getStoreMembershipForUser: vi.fn(async () => membershipState.current),
}));

vi.mock("./storeSystemPagesDb", () => ({
  getStoreSystemPages: vi.fn(async () => pagesState.current),
  upsertStoreSystemPage: vi.fn(async (_storeId: number, pageId: string, payload: unknown) => {
    pagesState.upserts.push({ pageId, payload });
  }),
}));

import { ownerSystemPagesRouter, storefrontSystemPagesRouter } from "./storeSystemPagesRouter";

function ownerCaller(role: string = "owner", status: string = "active", storeStatus: "setup" | "active" = "active") {
  membershipState.current = role === "none" ? null : { role, status };
  return ownerSystemPagesRouter.createCaller({
    user: { id: 7, role: "user", name: "Propriétaire test", email: "owner@example.test" },
    store: { id: 77, slug: "boutique-test", displayName: "Pattes & Compagnie", primaryDomain: "boutique.test", status: storeStatus, isPlatformStore: 0 },
    setupOwnerPanel: storeStatus === "setup",
  } as any);
}

function storefrontCaller() {
  return storefrontSystemPagesRouter.createCaller({
    user: null,
    store: { id: 77, slug: "boutique-test", displayName: "Pattes & Compagnie", primaryDomain: "boutique.test", status: "active", isPlatformStore: 0 },
  } as any);
}

describe("ownerSystemPagesRouter", () => {
  beforeEach(() => {
    membershipState.current = null;
    pagesState.current = { faq: [], contact: null, returns: null, about: null };
    pagesState.upserts = [];
    vi.clearAllMocks();
  });

  it("lets an active owner read pages and the compliance checklist", async () => {
    pagesState.current.faq = [{ id: "faq-1", question: "Livrez-vous ?", answer: "Oui." }];
    const result = await ownerCaller().getPages();
    expect(result.pages.faq).toHaveLength(1);
    expect(result.compliance).toMatchObject({ faq: "ready", contact: "missing", returns: "missing", about: "missing" });
  });

  it("refuses members without owner or manager role", async () => {
    await expect(ownerCaller("catalog_editor").getPages()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(ownerCaller("none").getPages()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses a blocked membership", async () => {
    await expect(ownerCaller("owner", "blocked").getPages()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("stores a normalized FAQ list scoped to the resolved store", async () => {
    const result = await ownerCaller().updateFaq({
      items: [
        { question: "  Livrez-vous en Suisse ? ", answer: " Oui, sous 3 à 5 jours. " },
        { question: "no", answer: "question trop courte, écartée" },
      ],
    });
    expect(result.items).toEqual([{ id: "faq-1", question: "Livrez-vous en Suisse ?", answer: "Oui, sous 3 à 5 jours." }]);
    expect(pagesState.upserts).toEqual([{ pageId: "faq", payload: result.items }]);
  });

  it("rejects a FAQ update where every entry is invalid", async () => {
    await expect(ownerCaller().updateFaq({ items: [{ question: "no", answer: "x" }] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an empty contact page", async () => {
    await expect(ownerCaller().updateContact({ title: "", intro: "", email: "", phone: "", address: "", hours: "" }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("saves returns and about pages through the same guard", async () => {
    await ownerCaller().updateTextPage({ pageId: "returns", content: { title: "Retours", body: "30 jours pour changer d'avis." } });
    await ownerCaller().updateTextPage({ pageId: "about", content: { title: "À propos", body: "Notre histoire." } });
    expect(pagesState.upserts.map(entry => entry.pageId)).toEqual(["returns", "about"]);
  });

  it("resets a page to the storefront fallback", async () => {
    await ownerCaller().resetPage({ pageId: "faq" });
    expect(pagesState.upserts).toEqual([{ pageId: "faq", payload: [] }]);
  });
});

describe("storefrontSystemPagesRouter", () => {
  beforeEach(() => {
    pagesState.current = { faq: [], contact: null, returns: null, about: null };
    vi.clearAllMocks();
  });

  it("renders template variables with the resolved store profile", async () => {
    pagesState.current.contact = {
      title: "Contactez {{store_name}}",
      intro: "Écrivez-nous !",
      email: "hello@pattes.test",
      phone: "",
      address: "",
      hours: "",
    };
    pagesState.current.returns = { title: "Retours", body: "Retours acceptés chez {{store_name}} sous 30 jours." };
    const pages = await storefrontCaller().getPages();
    expect(pages.contact?.title).toBe("Contactez Pattes & Compagnie");
    expect(pages.returns?.body).toBe("Retours acceptés chez Pattes & Compagnie sous 30 jours.");
  });

  it("returns empty content when the store never customized its pages", async () => {
    const pages = await storefrontCaller().getPages();
    expect(pages).toEqual({ faq: [], contact: null, returns: null, about: null });
  });

  it("hides pages of a store still in setup", async () => {
    const caller = storefrontSystemPagesRouter.createCaller({
      user: null,
      store: { id: 78, slug: "prep", displayName: "En préparation", primaryDomain: "prep.test", status: "setup", isPlatformStore: 0 },
    } as any);
    await expect(caller.getPages()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
