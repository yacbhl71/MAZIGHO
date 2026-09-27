import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeMocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
}));

const dbMocks = vi.hoisted(() => ({
  confirmStripeConnectSessionOwner: vi.fn(),
  finalizePaidOrderRedemption: vi.fn(),
  getOrderForStripeSession: vi.fn(),
  markOrderPaidByStripeSession: vi.fn(),
  queueCjSandboxPreparationForPaidOrder: vi.fn(),
  releaseExpiredStripePendingOrder: vi.fn(),
  setSettingValue: vi.fn(),
  storeOdooSaleOrderId: vi.fn(),
  storeStripeShippingAddress: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    webhooks = { constructEvent: stripeMocks.constructEvent };
  },
}));
vi.mock("./db", () => dbMocks);
vi.mock("./services/odoo", () => ({ syncOrderToOdoo: vi.fn() }));
vi.mock("./emails", () => ({ sendOrderConfirmationForStripeSession: vi.fn() }));

import {
  getStripeConnectWebhookAccount,
  isStripeConnectExpiredCheckoutEventType,
  isStripeConnectPaidCheckoutEventType,
  isVerifiedPaidStripeTestSession,
  stripeLiveWebhookHandler,
  stripeWebhookHandler,
} from "./stripeWebhook";

function responseSpy() {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockImplementation(() => response);
  return response as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

function request() {
  return { body: Buffer.from("{}"), headers: { "stripe-signature": "t=test,v1=test" } } as unknown as Request;
}

function paidSession() {
  return {
    id: "cs_test_123",
    livemode: false,
    mode: "payment",
    payment_status: "paid",
    payment_intent: "pi_test_123",
    customer_details: { email: "customer@example.test", phone: null },
    collected_information: null,
    customer_email: "customer@example.test",
  };
}

function checkoutEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_test_123",
    type: "checkout.session.completed",
    account: "acct_testBoutique",
    data: { object: paidSession() },
    ...overrides,
  };
}

describe("Stripe Connect Test webhook", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test_platform";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
    delete process.env.STRIPE_LIVE_SECRET_KEY;
    delete process.env.STRIPE_LIVE_WEBHOOK_SECRET;
    delete process.env.MAZIGHO_ENABLE_STRIPE_LIVE_CONNECT;
    for (const mock of Object.values(dbMocks)) mock.mockReset();
    stripeMocks.constructEvent.mockReset();
    dbMocks.getOrderForStripeSession.mockResolvedValue({ order: { storeId: 72, paymentMethod: "stripe_connect_test" }, items: [] });
    dbMocks.storeStripeShippingAddress.mockResolvedValue(undefined);
    dbMocks.finalizePaidOrderRedemption.mockResolvedValue(undefined);
    dbMocks.markOrderPaidByStripeSession.mockResolvedValue({ success: true, justPaid: true, processingUpdated: false });
    dbMocks.releaseExpiredStripePendingOrder.mockResolvedValue({ released: true, releasedLines: 1 });
  });

  it("accepts only Stripe Test sessions that are fully paid", () => {
    expect(isVerifiedPaidStripeTestSession(paidSession() as never)).toBe(true);
    expect(isVerifiedPaidStripeTestSession({ ...paidSession(), livemode: true } as never)).toBe(false);
    expect(isVerifiedPaidStripeTestSession({ ...paidSession(), payment_status: "unpaid" } as never)).toBe(false);
    expect(isStripeConnectPaidCheckoutEventType("checkout.session.completed")).toBe(true);
    expect(isStripeConnectPaidCheckoutEventType("checkout.session.async_payment_succeeded")).toBe(true);
    expect(isStripeConnectPaidCheckoutEventType("checkout.session.async_payment_failed")).toBe(false);
    expect(isStripeConnectExpiredCheckoutEventType("checkout.session.expired")).toBe(true);
    expect(isStripeConnectExpiredCheckoutEventType("checkout.session.completed")).toBe(false);
  });

  it("requires the connected-account event scope before any order transition", async () => {
    stripeMocks.constructEvent.mockReturnValue(checkoutEvent({ account: undefined }));
    const response = responseSpy();

    await stripeWebhookHandler(request(), response);

    expect(response.json).toHaveBeenCalledWith({ received: true, ignored: true });
    expect(dbMocks.confirmStripeConnectSessionOwner).not.toHaveBeenCalled();
    expect(dbMocks.markOrderPaidByStripeSession).not.toHaveBeenCalled();
    expect(getStripeConnectWebhookAccount(checkoutEvent({ account: "acct_testBoutique" }) as never)).toBe("acct_testBoutique");
    expect(getStripeConnectWebhookAccount(checkoutEvent({ account: "platform_account" }) as never)).toBeNull();
  });

  it("rejects a signed cross-store event before marking a local order paid", async () => {
    stripeMocks.constructEvent.mockReturnValue(checkoutEvent({ account: "acct_otherBoutique" }));
    dbMocks.confirmStripeConnectSessionOwner.mockResolvedValue({ accepted: false });
    const response = responseSpy();

    await stripeWebhookHandler(request(), response);

    expect(dbMocks.confirmStripeConnectSessionOwner).toHaveBeenCalledWith({ mode: "test", sessionId: "cs_test_123", stripeAccountId: "acct_otherBoutique", paymentIntentId: "pi_test_123" });
    expect(dbMocks.markOrderPaidByStripeSession).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ received: true, ignored: true });
  });

  it("confirms an account-bound paid Test checkout and keeps client direct charges out of Odoo and supplier flows", async () => {
    stripeMocks.constructEvent.mockReturnValue(checkoutEvent());
    dbMocks.confirmStripeConnectSessionOwner.mockResolvedValue({ accepted: true, orderId: 91 });
    const response = responseSpy();

    await stripeWebhookHandler(request(), response);

    expect(dbMocks.markOrderPaidByStripeSession).toHaveBeenCalledWith("cs_test_123");
    expect(dbMocks.storeStripeShippingAddress).toHaveBeenCalledWith("cs_test_123", expect.objectContaining({ email: "customer@example.test" }), 72);
    expect(dbMocks.finalizePaidOrderRedemption).toHaveBeenCalledWith("cs_test_123");
    expect(dbMocks.queueCjSandboxPreparationForPaidOrder).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ received: true });
  });

  it("does not accept a Test session on the separately configured Production endpoint", async () => {
    process.env.STRIPE_LIVE_SECRET_KEY = "sk_live_platform";
    process.env.STRIPE_LIVE_WEBHOOK_SECRET = "whsec_live_secret";
    process.env.MAZIGHO_ENABLE_STRIPE_LIVE_CONNECT = "true";
    stripeMocks.constructEvent.mockReturnValue(checkoutEvent());
    const response = responseSpy();

    await stripeLiveWebhookHandler(request(), response);

    expect(dbMocks.confirmStripeConnectSessionOwner).not.toHaveBeenCalled();
    expect(dbMocks.markOrderPaidByStripeSession).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ received: true });
  });

  it("releases only the matching unpaid reservation when Stripe expires a checkout", async () => {
    stripeMocks.constructEvent.mockReturnValue(checkoutEvent({
      type: "checkout.session.expired",
      data: { object: { ...paidSession(), payment_status: "unpaid" } },
    }));
    dbMocks.confirmStripeConnectSessionOwner.mockResolvedValue({ accepted: true, orderId: 91 });
    const response = responseSpy();

    await stripeWebhookHandler(request(), response);

    expect(dbMocks.confirmStripeConnectSessionOwner).toHaveBeenCalledWith({ mode: "test", sessionId: "cs_test_123", stripeAccountId: "acct_testBoutique" });
    expect(dbMocks.releaseExpiredStripePendingOrder).toHaveBeenCalledWith({ mode: "test", sessionId: "cs_test_123", stripeAccountId: "acct_testBoutique" });
    expect(dbMocks.markOrderPaidByStripeSession).not.toHaveBeenCalled();
    expect(response.json).toHaveBeenCalledWith({ received: true });
  });

  it("binds a real-mode session only to the live tenant payment record", async () => {
    process.env.STRIPE_LIVE_SECRET_KEY = "sk_live_platform";
    process.env.STRIPE_LIVE_WEBHOOK_SECRET = "whsec_live_secret";
    process.env.MAZIGHO_ENABLE_STRIPE_LIVE_CONNECT = "true";
    stripeMocks.constructEvent.mockReturnValue(checkoutEvent({ data: { object: { ...paidSession(), id: "cs_live_123", livemode: true, payment_intent: "pi_live_123" } } }));
    dbMocks.confirmStripeConnectSessionOwner.mockResolvedValue({ accepted: true, orderId: 92 });
    const response = responseSpy();

    await stripeLiveWebhookHandler(request(), response);

    expect(dbMocks.confirmStripeConnectSessionOwner).toHaveBeenCalledWith({ mode: "live", sessionId: "cs_live_123", stripeAccountId: "acct_testBoutique", paymentIntentId: "pi_live_123" });
    expect(dbMocks.markOrderPaidByStripeSession).toHaveBeenCalledWith("cs_live_123");
    expect(response.json).toHaveBeenCalledWith({ received: true });
  });
});
