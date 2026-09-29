import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  createContactMessage: vi.fn(async () => undefined),
}));
const mailMocks = vi.hoisted(() => ({
  sendPublicContactMessageAlert: vi.fn(async () => ({ delivered: true, id: "contact-alert-1" })),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./transactionalEmail", async () => ({
  ...(await vi.importActual<typeof import("./transactionalEmail")>("./transactionalEmail")),
  sendPublicContactMessageAlert: mailMocks.sendPublicContactMessageAlert,
}));

import { appRouter } from "./routers";

function storefrontCaller(storeId = 77) {
  return appRouter.createCaller({
    user: null,
    store: {
      id: storeId,
      slug: `boutique-${storeId}`,
      displayName: "Boutique test",
      primaryDomain: "boutique.test",
      status: "active",
      isPlatformStore: 0,
    },
  } as any);
}

describe("public contact form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mailMocks.sendPublicContactMessageAlert.mockResolvedValue({ delivered: true, id: "contact-alert-1" });
  });

  it("stores a public message in the resolved storefront and sends a metadata-only operator alert", async () => {
    await expect(storefrontCaller(77).contact.send({
      name: "Visiteur test",
      email: "visitor@example.test",
      subject: "Demande de renseignements",
      message: "Question publique sans donnée de commande.",
    })).resolves.toEqual({ success: true });

    expect(dbMocks.createContactMessage).toHaveBeenCalledWith({
      name: "Visiteur test",
      email: "visitor@example.test",
      subject: "Demande de renseignements",
      message: "Question publique sans donnée de commande.",
    }, 77);
    expect(mailMocks.sendPublicContactMessageAlert).toHaveBeenCalledWith({ storeName: "Boutique test" });
    expect(JSON.stringify(mailMocks.sendPublicContactMessageAlert.mock.calls[0][0])).not.toContain("visitor@example.test");
  });

  it("accepts the public message when the professional alert is temporarily unavailable", async () => {
    mailMocks.sendPublicContactMessageAlert.mockRejectedValueOnce(new Error("BREVO_UNAVAILABLE"));

    await expect(storefrontCaller(88).contact.send({
      name: "Visiteur test",
      email: "visitor@example.test",
      message: "Question qui doit rester enregistrée.",
    })).resolves.toEqual({ success: true });

    expect(dbMocks.createContactMessage).toHaveBeenCalledWith({
      name: "Visiteur test",
      email: "visitor@example.test",
      message: "Question qui doit rester enregistrée.",
    }, 88);
  });
});
