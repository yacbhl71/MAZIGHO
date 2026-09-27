import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  decideLemonSqueezyWebhookApplication,
  getLemonSqueezyBillingConfiguration,
  hasLemonSqueezySubscriptionAccess,
  isValidLemonSqueezySignature,
  lemonSqueezyWebhookBodyHash,
  parseLemonSqueezyBillingWebhook,
  shouldProcessLemonSqueezyWebhookEvent,
} from "./lemonSqueezyBilling";

const readyConfig = {
  MAZIGHO_ENABLE_LEMONSQUEEZY_TEST: "true",
  LEMONSQUEEZY_API_KEY: "test",
  LEMONSQUEEZY_STORE_ID: "42",
  LEMONSQUEEZY_BASIC_VARIANT_ID: "99",
  LEMONSQUEEZY_PRO_VARIANT_ID: "100",
  LEMONSQUEEZY_LIFETIME_VARIANT_ID: "101",
  LEMONSQUEEZY_WEBHOOK_SECRET: "test-webhook-secret",
};

describe("Lemon Squeezy SaaS billing policy", () => {
  it("stays closed unless every Test-only credential is configured", () => {
    expect(getLemonSqueezyBillingConfiguration({})).toEqual({ enabled: false, mode: "test", reason: "test_mode_disabled" });
    expect(getLemonSqueezyBillingConfiguration({ MAZIGHO_ENABLE_LEMONSQUEEZY_TEST: "true" })).toEqual({ enabled: false, mode: "test", reason: "api_key_missing" });
    expect(getLemonSqueezyBillingConfiguration({ MAZIGHO_ENABLE_LEMONSQUEEZY_TEST: "true", LEMONSQUEEZY_API_KEY: "test" })).toEqual({ enabled: false, mode: "test", reason: "store_id_missing" });
    expect(getLemonSqueezyBillingConfiguration({ ...readyConfig, LEMONSQUEEZY_BASIC_VARIANT_ID: "" })).toEqual({ enabled: false, mode: "test", reason: "variant_missing" });
    expect(getLemonSqueezyBillingConfiguration({ ...readyConfig, LEMONSQUEEZY_WEBHOOK_SECRET: "" })).toEqual({ enabled: false, mode: "test", reason: "webhook_secret_missing" });
    expect(getLemonSqueezyBillingConfiguration(readyConfig)).toMatchObject({ enabled: true, mode: "test", storeId: 42, variants: { basic: 99, pro: 100, lifetime: 101 } });
  });

  it("accepts an HMAC only for the exact raw payload", () => {
    const body = Buffer.from('{"meta":{"event_name":"order_created"}}');
    const signature = createHmac("sha256", "test-webhook-secret").update(body).digest("hex");
    expect(isValidLemonSqueezySignature(body, signature, "test-webhook-secret")).toBe(true);
    expect(isValidLemonSqueezySignature(Buffer.from("{}"), signature, "test-webhook-secret")).toBe(false);
    expect(lemonSqueezyWebhookBodyHash(body)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("parses only a signed-test-shaped tenant-bound Basic subscription", () => {
    const payload = {
      meta: { event_name: "subscription_updated", custom_data: { mazigho_checkout_nonce: "a".repeat(32), mazigho_store_id: "72", mazigho_plan_id: "basic" } },
      data: { type: "subscriptions", id: "sub_test_123", attributes: { test_mode: true, store_id: 44, variant_id: 99, status: "active", order_id: 55, renews_at: "2026-10-27T10:00:00.000Z", ends_at: null } },
    };
    expect(parseLemonSqueezyBillingWebhook(payload)).toMatchObject({ resourceType: "subscriptions", storeId: 72, providerStoreId: 44, variantId: 99, planId: "basic", resourceId: "sub_test_123", subscription: { status: "active" } });
    expect(parseLemonSqueezyBillingWebhook({ ...payload, data: { ...payload.data, attributes: { ...payload.data.attributes, test_mode: false } } })).toBeNull();
  });

  it("does not call expired or past-due subscriptions active", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(hasLemonSqueezySubscriptionAccess("active", null)).toBe(true);
    expect(hasLemonSqueezySubscriptionAccess("cancelled", tomorrow)).toBe(true);
    expect(hasLemonSqueezySubscriptionAccess("cancelled", yesterday)).toBe(false);
    expect(hasLemonSqueezySubscriptionAccess("past_due", tomorrow)).toBe(false);
  });

  it("accepts only the configured provider store, variant and matching local tenant checkout", () => {
    const event = parseLemonSqueezyBillingWebhook({
      meta: { event_name: "subscription_created", custom_data: { mazigho_checkout_nonce: "b".repeat(32), mazigho_store_id: "72", mazigho_plan_id: "pro" } },
      data: { type: "subscriptions", id: "sub_test_1", attributes: { test_mode: true, store_id: 44, variant_id: 100, status: "active", order_id: 55, renews_at: null, ends_at: null } },
    });
    expect(event).not.toBeNull();
    if (!event) return;
    const checkout = { storeId: 72, planId: "pro", status: "created" as const, lemonOrderId: null };
    expect(decideLemonSqueezyWebhookApplication({ event, checkout, expectedProviderStoreId: 44, expectedVariantId: 100 })).toEqual({ accepted: true, action: "upsert_subscription" });
    expect(decideLemonSqueezyWebhookApplication({ event, checkout: { ...checkout, storeId: 73 }, expectedProviderStoreId: 44, expectedVariantId: 100 })).toEqual({ accepted: false, reason: "checkout_mismatch" });
    expect(decideLemonSqueezyWebhookApplication({ event, checkout, expectedProviderStoreId: 45, expectedVariantId: 100 })).toEqual({ accepted: false, reason: "provider_store_mismatch" });
  });

  it("refuses a Pro order and a Lifetime subscription even when provider-signed", () => {
    const proOrder = parseLemonSqueezyBillingWebhook({
      meta: { event_name: "order_created", custom_data: { mazigho_checkout_nonce: "c".repeat(32), mazigho_store_id: "72", mazigho_plan_id: "pro" } },
      data: { type: "orders", id: "order_test_2", attributes: { test_mode: true, store_id: 44, status: "paid", first_order_item: { variant_id: 100 } } },
    });
    const lifetimeSubscription = parseLemonSqueezyBillingWebhook({
      meta: { event_name: "subscription_created", custom_data: { mazigho_checkout_nonce: "d".repeat(32), mazigho_store_id: "72", mazigho_plan_id: "lifetime" } },
      data: { type: "subscriptions", id: "sub_test_2", attributes: { test_mode: true, store_id: 44, variant_id: 101, status: "active", order_id: "order_test_3", renews_at: null, ends_at: null } },
    });
    expect(proOrder).not.toBeNull();
    expect(lifetimeSubscription).not.toBeNull();
    if (!proOrder || !lifetimeSubscription) return;
    expect(decideLemonSqueezyWebhookApplication({ event: proOrder, checkout: { storeId: 72, planId: "pro", status: "created", lemonOrderId: null }, expectedProviderStoreId: 44, expectedVariantId: 100 })).toEqual({ accepted: false, reason: "unexpected_order_plan" });
    expect(decideLemonSqueezyWebhookApplication({ event: lifetimeSubscription, checkout: { storeId: 72, planId: "lifetime", status: "created", lemonOrderId: null }, expectedProviderStoreId: 44, expectedVariantId: 101 })).toEqual({ accepted: false, reason: "unexpected_subscription_plan" });
  });

  it("keeps duplicate webhook processing idempotent without a store lifecycle action", () => {
    expect(shouldProcessLemonSqueezyWebhookEvent(null)).toBe(true);
    expect(shouldProcessLemonSqueezyWebhookEvent("failed")).toBe(true);
    expect(shouldProcessLemonSqueezyWebhookEvent("processing")).toBe(false);
    const decision = decideLemonSqueezyWebhookApplication({
      event: { eventName: "order_created", resourceType: "orders", resourceId: "order_test_4", checkoutNonce: "e".repeat(32), storeId: 72, providerStoreId: 44, variantId: 101, planId: "lifetime", testMode: true, orderId: "order_test_4", orderPaymentStatus: "paid", subscription: null },
      checkout: { storeId: 72, planId: "lifetime", status: "paid", lemonOrderId: "order_test_4" },
      expectedProviderStoreId: 44,
      expectedVariantId: 101,
    });
    expect(decision).toEqual({ accepted: true, action: "already_recorded" });
    expect(JSON.stringify(decision)).not.toContain("storeStatus");
  });
});
