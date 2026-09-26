import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeMocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  retrieveSession: vi.fn(),
  createCoupon: vi.fn(),
}));

const dbMocks = vi.hoisted(() => ({
  bindStripeConnectSessionToPendingOrder: vi.fn(),
  cancelUnboundStripePendingOrder: vi.fn(),
  createStripePendingOrder: vi.fn(),
  getOrderForStripeSessionForStore: vi.fn(),
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

describe("Stripe Connect Test checkout route", () => {
  beforeEach(() => {
    process.env.MAZIGHO_ENABLE_STRIPE_TEST_CONNECT = "true";
    process.env.STRIPE_SECRET_KEY = "sk_test_platform";
    for (const mock of Object.values(dbMocks)) mock.mockReset();
    for (const mock of Object.values(stripeMocks)) mock.mockReset();
    for (const mock of Object.values(webhookMocks)) mock.mockReset();
    dbMocks.getStripeCheckoutCart.mockResolvedValue(cart);
    dbMocks.getStoreStripeConnectCheckoutContext.mockResolvedValue({ ready: true, accountId: "acct_testBoutique", commissionRateBps: 250, planId: "basic" });
    dbMocks.createStripePendingOrder.mockResolvedValue({ id: 91 });
    dbMocks.bindStripeConnectSessionToPendingOrder.mockResolvedValue({ id: 91 });
    stripeMocks.createSession.mockResolvedValue({ id: "cs_test_123", url: "https://checkout.stripe.test/session" });
  });

  it("creates a tenant-bound Direct Charge with the official BASIC fee", async () => {
    const result = await callerFor().createSession({ countryCode: "CH", items: [{ productId: 41, quantity: 1 }] });

    expect(dbMocks.getStripeCheckoutCart).toHaveBeenCalledWith(7, "CH", [{ productId: 41, quantity: 1 }], 72);
    expect(stripeMocks.createSession).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      payment_intent_data: { application_fee_amount: 250 },
      metadata: expect.objectContaining({ store_id: "72", order_id: "91", commission_rate_bps: "250" }),
    }), { stripeAccount: "acct_testBoutique" });
    expect(dbMocks.bindStripeConnectSessionToPendingOrder).toHaveBeenCalledWith({
      storeId: 72,
      userId: 7,
      orderId: 91,
      sessionId: "cs_test_123",
      stripeAccountId: "acct_testBoutique",
      applicationFeeAmount: 250,
      commissionRateBps: 250,
    });
    expect(result).toEqual({ sessionId: "cs_test_123", orderId: 91, url: "https://checkout.stripe.test/session" });
  });

  it("cancels the local pending order if Stripe does not return a checkout URL", async () => {
    stripeMocks.createSession.mockResolvedValue({ id: "cs_test_missing_url", url: null });

    await expect(callerFor().createSession({ countryCode: "CH", items: [{ productId: 41, quantity: 1 }] })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });

    expect(dbMocks.cancelUnboundStripePendingOrder).toHaveBeenCalledWith({ storeId: 72, userId: 7, orderId: 91 });
    expect(dbMocks.bindStripeConnectSessionToPendingOrder).not.toHaveBeenCalled();
  });

  it("reconciles the browser return only through the same tenant account and user", async () => {
    dbMocks.getStoreStripeConnectSetup.mockResolvedValue({ account: { accountId: "acct_testBoutique" } });
    dbMocks.getOrderForStripeSessionForStore.mockResolvedValue({ id: 91 });
    stripeMocks.retrieveSession.mockResolvedValue({ id: "cs_test_123", metadata: { user_id: "7" }, payment_status: "paid" });
    webhookMocks.isVerifiedPaidStripeTestSession.mockReturnValue(true);
    dbMocks.markOrderPaidByStripeSession.mockResolvedValue({ success: true, justPaid: true, processingUpdated: false });

    await expect(callerFor().getSessionStatus({ sessionId: "cs_test_123" })).resolves.toEqual({ status: "paid", total: undefined, email: undefined });

    expect(stripeMocks.retrieveSession).toHaveBeenCalledWith("cs_test_123", {}, { stripeAccount: "acct_testBoutique" });
    expect(dbMocks.getOrderForStripeSessionForStore).toHaveBeenCalledWith("cs_test_123", 7, 72);
    expect(dbMocks.markOrderPaidByStripeSession).toHaveBeenCalledWith("cs_test_123");
    expect(webhookMocks.completePaidStripeOrder).toHaveBeenCalledWith(expect.objectContaining({ id: "cs_test_123" }), { sendCustomerEmail: true });
  });
});
