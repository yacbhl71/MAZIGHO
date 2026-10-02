import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeMocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  retrieveSession: vi.fn(),
  createCoupon: vi.fn(),
}));

const dbMocks = vi.hoisted(() => ({
  bindStripeConnectSessionToPendingOrder: vi.fn(),
  cancelUnboundStripePendingOrder: vi.fn(),
  createAlgeriaCashOnDeliveryOrder: vi.fn(),
  createStripePendingOrder: vi.fn(),
  getOrderForStripeSessionForStore: vi.fn(),
  getStoreMaintenanceMode: vi.fn(),
  getStoreStripeConnectCheckoutContext: vi.fn(),
  getStoreStripeConnectSetup: vi.fn(),
  getStripeCheckoutCart: vi.fn(),
  markOrderPaidByStripeSession: vi.fn(),
  validatePromotion: vi.fn(),
}));

const webhookMocks = vi.hoisted(() => ({
  completePaidStripeOrder: vi.fn(),
  isVerifiedPaidStripeTestSession: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    coupons = { create: stripeMocks.createCoupon };
    checkout = { sessions: { create: stripeMocks.createSession, retrieve: stripeMocks.retrieveSession } };
  },
}));
vi.mock("./db", () => dbMocks);
vi.mock("./stripeWebhook", () => webhookMocks);

import { stripeCheckoutRouter } from "./stripeCheckout";

function callerFor(storeId = 72, userId = 7) {
  return stripeCheckoutRouter.createCaller({
    user: { id: userId, email: "customer@example.test" },
    store: { id: storeId, primaryDomain: "boutique.test", status: "active" },
  } as never);
}

const cart = {
  items: [{ productId: 41, name: "Kit créatif", quantity: 1, unitAmount: 10_000, unitAmountChf: 10_000, shippingAmount: 0, selectedOptions: {}, supplierSnapshot: {} }],
  currency: { code: "CHF", rateBps: 10_000 },
  productSubtotal: 10_000,
  productSubtotalChf: 10_000,
  customerShippingAmount: 0,
  customerShippingAmountChf: 0,
  shippingPolicy: "included",
  totalAmount: 10_000,
  totalAmountChf: 10_000,
};
const legalAcceptanceVersion = "2026-09-28" as const;

describe("Stripe Connect Test checkout route", () => {
  beforeEach(() => {
    process.env.MAZIGHO_ENABLE_STRIPE_TEST_CONNECT = "true";
    process.env.MAZIGHO_ENABLE_STRIPE_TEST_CHECKOUT = "true";
    process.env.STRIPE_SECRET_KEY = "sk_test_platform";
    delete process.env.STRIPE_LIVE_SECRET_KEY;
    delete process.env.MAZIGHO_ENABLE_STRIPE_LIVE_CONNECT;
    delete process.env.MAZIGHO_ENABLE_STRIPE_LIVE_CHECKOUT;
    for (const mock of Object.values(dbMocks)) mock.mockReset();
    for (const mock of Object.values(stripeMocks)) mock.mockReset();
    for (const mock of Object.values(webhookMocks)) mock.mockReset();
    dbMocks.getStoreMaintenanceMode.mockResolvedValue({ enabled: false, title: "Retour bientôt", message: "La boutique est en pause." });
    dbMocks.getStripeCheckoutCart.mockResolvedValue(cart);
    dbMocks.getStoreStripeConnectCheckoutContext.mockResolvedValue({ ready: true, accountId: "acct_testBoutique", commissionRateBps: 250, planId: "basic" });
    dbMocks.createStripePendingOrder.mockResolvedValue({ id: 91 });
    dbMocks.createAlgeriaCashOnDeliveryOrder.mockResolvedValue({ id: 92, created: true });
    dbMocks.bindStripeConnectSessionToPendingOrder.mockResolvedValue({ id: 91 });
    stripeMocks.createSession.mockResolvedValue({ id: "cs_test_123", url: "https://checkout.stripe.test/session" });
  });

  it("creates a tenant-bound Direct Charge with the official BASIC fee", async () => {
    const result = await callerFor().createSession({ countryCode: "CH", legalAcceptanceVersion, legalAccepted: true, items: [{ productId: 41, quantity: 1 }] });

    expect(dbMocks.getStripeCheckoutCart).toHaveBeenCalledWith(7, "CH", [{ productId: 41, quantity: 1 }], 72);
    expect(dbMocks.createStripePendingOrder).toHaveBeenCalledWith(expect.objectContaining({ legalAcceptanceVersion }));
    expect(stripeMocks.createSession).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      payment_intent_data: { application_fee_amount: 250 },
      metadata: expect.objectContaining({ store_id: "72", order_id: "91", commission_rate_bps: "250" }),
    }), { stripeAccount: "acct_testBoutique" });
    const checkoutParams = stripeMocks.createSession.mock.calls[0]?.[0] as { expires_at?: number };
    expect(checkoutParams.expires_at).toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) + 30 * 60);
    expect(checkoutParams.expires_at).toBeLessThanOrEqual(Math.floor(Date.now() / 1000) + 31 * 60);
    expect(dbMocks.bindStripeConnectSessionToPendingOrder).toHaveBeenCalledWith({
      storeId: 72,
      userId: 7,
      mode: "test",
      orderId: 91,
      sessionId: "cs_test_123",
      stripeAccountId: "acct_testBoutique",
      applicationFeeAmount: 250,
      commissionRateBps: 250,
    });
    expect(result).toEqual({ sessionId: "cs_test_123", orderId: 91, url: "https://checkout.stripe.test/session" });
  });

  it("records a Studio-granted zero-percent commission for the selected store only", async () => {
    dbMocks.getStoreStripeConnectCheckoutContext.mockResolvedValueOnce({ ready: true, accountId: "acct_testBoutique", commissionRateBps: 0, planId: "pro" });

    await callerFor(72).createSession({ countryCode: "CH", legalAcceptanceVersion, legalAccepted: true, items: [{ productId: 41, quantity: 1 }] });

    expect(stripeMocks.createSession).toHaveBeenCalledWith(expect.objectContaining({
      payment_intent_data: { application_fee_amount: 0 },
      metadata: expect.objectContaining({ store_id: "72", commission_rate_bps: "0" }),
    }), { stripeAccount: "acct_testBoutique" });
    expect(dbMocks.bindStripeConnectSessionToPendingOrder).toHaveBeenCalledWith(expect.objectContaining({
      storeId: 72,
      applicationFeeAmount: 0,
      commissionRateBps: 0,
    }));
  });

  it("refuses checkout while the resolved boutique is in maintenance", async () => {
    dbMocks.getStoreMaintenanceMode.mockResolvedValueOnce({ enabled: true, title: "Mise à jour", message: "Revenez bientôt." });
    await expect(callerFor().createSession({ countryCode: "CH", legalAcceptanceVersion, legalAccepted: true, items: [{ productId: 41, quantity: 1 }] }))
      .rejects.toMatchObject({ code: "FORBIDDEN", message: expect.stringContaining("maintenance") });
    expect(dbMocks.getStripeCheckoutCart).not.toHaveBeenCalled();
  });

  it("creates an Algeria payment-on-delivery order only for the resolved store and customer", async () => {
    await expect(callerFor(72, 7).createAlgeriaCashOnDeliveryOrder({
      requestId: "431a76c2-40fa-4b07-875b-e8af89957f3c",
      countryCode: "DZ",
      wilayaCode: "16",
      deliveryMode: "home",
      legalAcceptanceVersion,
      legalAccepted: true,
      address: { name: "Client test", phone: "+213 555 00 00 00", line1: "Rue Exemple 4", city: "Alger", postalCode: "16000" },
      items: [{ productId: 41, quantity: 1 }],
    })).resolves.toEqual({ id: 92, created: true });

    expect(dbMocks.createAlgeriaCashOnDeliveryOrder).toHaveBeenCalledWith(expect.objectContaining({
      userId: 7,
      storeId: 72,
      countryCode: "DZ",
      wilayaCode: "16",
      deliveryMode: "home",
      legalAcceptanceVersion,
      legalAccepted: true,
    }));
    expect(stripeMocks.createSession).not.toHaveBeenCalled();
  });

  it("requires a selected wilaya and delivery mode for Algeria payment on delivery", async () => {
    await expect(callerFor().createAlgeriaCashOnDeliveryOrder({
      requestId: "431a76c2-40fa-4b07-875b-e8af89957f3c",
      countryCode: "DZ",
      legalAcceptanceVersion,
      legalAccepted: true,
      address: { name: "Client test", phone: "+213 555 00 00 00", line1: "Rue Exemple 4", city: "Alger", postalCode: "16000" },
      items: [{ productId: 41, quantity: 1 }],
    } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMocks.createAlgeriaCashOnDeliveryOrder).not.toHaveBeenCalled();
  });

  it("uses the isolated Production account context only after both live flags are enabled", async () => {
    process.env.STRIPE_LIVE_SECRET_KEY = "sk_live_platform";
    process.env.MAZIGHO_ENABLE_STRIPE_LIVE_CONNECT = "true";
    process.env.MAZIGHO_ENABLE_STRIPE_LIVE_CHECKOUT = "true";
    stripeMocks.createSession.mockResolvedValue({ id: "cs_live_123", url: "https://checkout.stripe.live/session" });

    await callerFor().createSession({ countryCode: "CH", legalAcceptanceVersion, legalAccepted: true, items: [{ productId: 41, quantity: 1 }] });

    expect(dbMocks.getStoreStripeConnectCheckoutContext).toHaveBeenCalledWith(72, "live");
    expect(dbMocks.createStripePendingOrder).toHaveBeenCalledWith(expect.objectContaining({ mode: "live", storeId: 72 }));
    expect(dbMocks.bindStripeConnectSessionToPendingOrder).toHaveBeenCalledWith(expect.objectContaining({ mode: "live", sessionId: "cs_live_123" }));
    expect(stripeMocks.createSession).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ stripe_connect_mode: "live" }) }), { stripeAccount: "acct_testBoutique" });
  });

  it("cancels the local pending order if Stripe does not return a checkout URL", async () => {
    stripeMocks.createSession.mockResolvedValue({ id: "cs_test_missing_url", url: null });

    await expect(callerFor().createSession({ countryCode: "CH", legalAcceptanceVersion, legalAccepted: true, items: [{ productId: 41, quantity: 1 }] })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });

    expect(dbMocks.cancelUnboundStripePendingOrder).toHaveBeenCalledWith({ storeId: 72, userId: 7, orderId: 91 });
    expect(dbMocks.bindStripeConnectSessionToPendingOrder).not.toHaveBeenCalled();
  });

  it("requires the current legal acceptance version before opening Stripe", async () => {
    await expect(callerFor().createSession({ countryCode: "CH", items: [{ productId: 41, quantity: 1 }] } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMocks.getStripeCheckoutCart).not.toHaveBeenCalled();
    expect(stripeMocks.createSession).not.toHaveBeenCalled();
  });

  it("reconciles the browser return only through the same tenant account and user", async () => {
    dbMocks.getStoreStripeConnectSetup.mockResolvedValue({ account: { accountId: "acct_testBoutique" } });
    dbMocks.getOrderForStripeSessionForStore
      .mockResolvedValueOnce({ id: 91, status: "pending", paymentStatus: "unpaid", totalAmount: 10_000, currencyCode: "CHF" })
      .mockResolvedValueOnce({ id: 91, status: "processing", paymentStatus: "paid", totalAmount: 10_000, currencyCode: "CHF" });
    stripeMocks.retrieveSession.mockResolvedValue({ id: "cs_test_123", metadata: { user_id: "7" }, payment_status: "paid" });
    webhookMocks.isVerifiedPaidStripeTestSession.mockReturnValue(true);
    dbMocks.markOrderPaidByStripeSession.mockResolvedValue({ success: true, justPaid: true, processingUpdated: false });

    await expect(callerFor().getSessionStatus({ sessionId: "cs_test_123" })).resolves.toEqual({
      status: "paid",
      mode: "test",
      order: { id: 91, status: "processing", paymentStatus: "paid", totalAmount: 10_000, currencyCode: "CHF" },
    });

    expect(stripeMocks.retrieveSession).toHaveBeenCalledWith("cs_test_123", {}, { stripeAccount: "acct_testBoutique" });
    expect(dbMocks.getOrderForStripeSessionForStore).toHaveBeenCalledWith("cs_test_123", 7, 72);
    expect(dbMocks.getOrderForStripeSessionForStore).toHaveBeenCalledTimes(2);
    expect(dbMocks.markOrderPaidByStripeSession).toHaveBeenCalledWith("cs_test_123");
    expect(webhookMocks.completePaidStripeOrder).toHaveBeenCalledWith(expect.objectContaining({ id: "cs_test_123" }), { mode: "test", sendCustomerEmail: true });
  });

  it("does not confirm or advance an unpaid return session", async () => {
    dbMocks.getStoreStripeConnectSetup.mockResolvedValue({ account: { accountId: "acct_testBoutique" } });
    dbMocks.getOrderForStripeSessionForStore.mockResolvedValue({ id: 91, status: "pending", paymentStatus: "unpaid", totalAmount: 10_000, currencyCode: "CHF" });
    stripeMocks.retrieveSession.mockResolvedValue({ id: "cs_test_123", metadata: { user_id: "7" }, payment_status: "unpaid" });
    webhookMocks.isVerifiedPaidStripeTestSession.mockReturnValue(false);

    await expect(callerFor().getSessionStatus({ sessionId: "cs_test_123" })).resolves.toEqual({
      status: "unpaid",
      mode: "test",
      order: { id: 91, status: "pending", paymentStatus: "unpaid", totalAmount: 10_000, currencyCode: "CHF" },
    });

    expect(dbMocks.markOrderPaidByStripeSession).not.toHaveBeenCalled();
    expect(webhookMocks.completePaidStripeOrder).not.toHaveBeenCalled();
  });
});
