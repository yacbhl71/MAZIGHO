import { beforeEach, describe, expect, it, vi } from "vitest";

const emailTemplate = {
  subject: "{{boutique}} · commande #{{commande}}",
  heading: "Suivi de commande",
  body: "Bonjour {{prenom}},\n{{boutique}} prépare votre commande #{{commande}}.\nSuivi : {{suivi}}",
  buttonLabel: "Voir ma commande",
  enabled: true,
};

const dbMocks = vi.hoisted(() => ({
  getEmailTemplate: vi.fn(async () => emailTemplate),
  getOrderForStripeSession: vi.fn(async () => ({
    order: { id: 44, storeId: 77, userName: "Sylvie Bahloul", userEmail: "sylvie@example.test", totalAmount: 7900, currencyCode: "CHF", storeDisplayName: "Atelier Sylvie" },
    items: [{ productName: "Kit créatif", quantity: 1, priceAtPurchase: 7900 }],
  })),
}));
const mailMocks = vi.hoisted(() => ({
  sendTransactionalEmail: vi.fn(async () => ({ delivered: true, id: "brevo-test-1" })),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./transactionalEmail", () => ({
  escapeHtml: (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
  getPublicUrl: () => "https://boutique.example.test",
  isTransactionalEmailConfigured: () => true,
  sendTransactionalEmail: mailMocks.sendTransactionalEmail,
}));

import { sendOrderConfirmationForStripeSession, sendOrderShippedEmail } from "./emails";

describe("shop-branded transactional order emails", () => {
  beforeEach(() => vi.clearAllMocks());

  it("brands a paid order confirmation with the selling shop", async () => {
    await expect(sendOrderConfirmationForStripeSession("cs_live_44")).resolves.toEqual({ delivered: true, id: "brevo-test-1" });
    expect(mailMocks.sendTransactionalEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "sylvie@example.test",
      subject: "Atelier Sylvie · commande #44",
      idempotencyKey: "order-confirmation/44",
    }));
    expect(dbMocks.getEmailTemplate).toHaveBeenCalledWith("order_confirmation", 77);
    const payload = mailMocks.sendTransactionalEmail.mock.calls[0][0];
    expect(payload.html).toContain("Atelier Sylvie");
    expect(payload.text).toContain("Atelier Sylvie");
  });

  it("brands an explicit shipment notice without exposing delivery data", async () => {
    dbMocks.getEmailTemplate.mockResolvedValueOnce({
      ...emailTemplate,
      subject: "MAZIGHO · commande #{{commande}}",
      body: "MAZIGHO vous informe que la commande #{{commande}} est en route.",
    });
    await expect(sendOrderShippedEmail({
      email: "client@example.test",
      name: "Client test",
      orderId: 81,
      trackingNumber: "CH-TRACK-81",
      storeName: "Pattes & Compagnie",
      storeId: 81,
    })).resolves.toEqual({ delivered: true, id: "brevo-test-1" });
    expect(mailMocks.sendTransactionalEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "client@example.test",
      subject: "Pattes & Compagnie · commande #81",
      idempotencyKey: "order-shipped/81",
    }));
    expect(dbMocks.getEmailTemplate).toHaveBeenCalledWith("order_shipped", 81);
    const payload = mailMocks.sendTransactionalEmail.mock.calls[0][0];
    expect(payload.html).toContain("Pattes &amp; Compagnie");
    expect(payload.html).not.toContain("Rue");
  });

  it("keeps the main MAZIGHO store on its existing platform template", async () => {
    dbMocks.getOrderForStripeSession.mockResolvedValueOnce({
      order: { id: 92, storeId: 1, storeIsPlatform: true, userName: "Client", userEmail: "client@example.test", totalAmount: 2500, currencyCode: "CHF", storeDisplayName: "MAZIGHO" },
      items: [{ productName: "Article", quantity: 1, priceAtPurchase: 2500 }],
    });

    await expect(sendOrderConfirmationForStripeSession("cs_live_platform")).resolves.toEqual({ delivered: true, id: "brevo-test-1" });
    expect(dbMocks.getEmailTemplate).toHaveBeenCalledWith("order_confirmation", undefined);
  });
});
