import { createHmac } from "node:crypto";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  applyLemonSqueezyBillingWebhook: vi.fn(),
  beginLemonSqueezyWebhookEvent: vi.fn(),
  completeLemonSqueezyWebhookEvent: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { lemonSqueezyWebhookHandler } from "./lemonSqueezyWebhook";

const webhookSecret = "test-webhook-secret";

function validPayload() {
  return {
    meta: {
      event_name: "order_created",
      custom_data: {
        mazigho_checkout_nonce: "a".repeat(32),
        mazigho_store_id: "72",
        mazigho_plan_id: "lifetime",
      },
    },
    data: {
      type: "orders",
      id: "order_test_123",
      attributes: {
        test_mode: true,
        store_id: 44,
        status: "paid",
        first_order_item: { variant_id: 101 },
      },
    },
  };
}

function requestFor(body: Buffer, signature = createHmac("sha256", webhookSecret).update(body).digest("hex")) {
  return { body, headers: { "x-signature": signature } } as unknown as Request;
}

function responseSpy() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockImplementation(() => response);
  return response as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

describe("Lemon Squeezy Test webhook handler", () => {
  beforeEach(() => {
    process.env.MAZIGHO_ENABLE_LEMONSQUEEZY_TEST = "true";
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = webhookSecret;
    dbMocks.applyLemonSqueezyBillingWebhook.mockReset();
    dbMocks.beginLemonSqueezyWebhookEvent.mockReset();
    dbMocks.completeLemonSqueezyWebhookEvent.mockReset();
  });

  it("rejects an invalid HMAC before parsing or writing anything", async () => {
    const body = Buffer.from(JSON.stringify(validPayload()));
    const response = responseSpy();

    await lemonSqueezyWebhookHandler(requestFor(body, "0".repeat(64)), response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ error: "Signature Lemon Squeezy invalide" });
    expect(dbMocks.beginLemonSqueezyWebhookEvent).not.toHaveBeenCalled();
    expect(dbMocks.applyLemonSqueezyBillingWebhook).not.toHaveBeenCalled();
  });

  it("records a tenant-mismatched signed event as failed without granting access", async () => {
    const body = Buffer.from(JSON.stringify(validPayload()));
    const response = responseSpy();
    dbMocks.beginLemonSqueezyWebhookEvent.mockResolvedValue({ shouldProcess: true });
    dbMocks.applyLemonSqueezyBillingWebhook.mockResolvedValue({ accepted: false, reason: "checkout_mismatch" });
    dbMocks.completeLemonSqueezyWebhookEvent.mockResolvedValue(undefined);

    await lemonSqueezyWebhookHandler(requestFor(body), response);

    expect(response.status).toHaveBeenCalledWith(422);
    expect(dbMocks.applyLemonSqueezyBillingWebhook).toHaveBeenCalledOnce();
    expect(dbMocks.completeLemonSqueezyWebhookEvent).toHaveBeenCalledWith(expect.any(String), { failureCode: "LEMONSQUEEZY_CHECKOUT_MISMATCH" });
  });

  it("treats a duplicate raw event as idempotent and does not reapply it", async () => {
    const body = Buffer.from(JSON.stringify(validPayload()));
    const response = responseSpy();
    dbMocks.beginLemonSqueezyWebhookEvent.mockResolvedValue({ shouldProcess: false });

    await lemonSqueezyWebhookHandler(requestFor(body), response);

    expect(response.json).toHaveBeenCalledWith({ received: true, duplicate: true });
    expect(dbMocks.applyLemonSqueezyBillingWebhook).not.toHaveBeenCalled();
    expect(dbMocks.completeLemonSqueezyWebhookEvent).not.toHaveBeenCalled();
  });
});
