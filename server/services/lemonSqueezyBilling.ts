import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { MazighoSaasPlanId } from "../../shared/mazighoSaasPlans";

export const lemonSqueezyBillablePlanIds = ["pro", "lifetime"] as const;
export type LemonSqueezyBillablePlanId = (typeof lemonSqueezyBillablePlanIds)[number];
export type LemonSqueezyBillingMode = "test";

export const lemonSqueezySubscriptionStatuses = ["on_trial", "active", "paused", "past_due", "unpaid", "cancelled", "expired"] as const;
export type LemonSqueezySubscriptionStatus = (typeof lemonSqueezySubscriptionStatuses)[number];

export type LemonSqueezyBillingConfiguration =
  | { enabled: false; mode: LemonSqueezyBillingMode; reason: "test_mode_disabled" | "api_key_missing" | "store_id_missing" | "variant_missing" | "webhook_secret_missing" }
  | { enabled: true; mode: LemonSqueezyBillingMode; apiKey: string; storeId: number; variants: Record<LemonSqueezyBillablePlanId, number> };

function positiveInteger(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function isBillablePlan(value: unknown): value is LemonSqueezyBillablePlanId {
  return typeof value === "string" && (lemonSqueezyBillablePlanIds as readonly string[]).includes(value);
}

export function getLemonSqueezyBillingConfiguration(environment: NodeJS.ProcessEnv = process.env): LemonSqueezyBillingConfiguration {
  // All MAZIGHO Lemon Squeezy work starts in provider Test Mode. Live charging
  // is intentionally absent from this policy and needs a separate approval.
  if (environment.MAZIGHO_ENABLE_LEMONSQUEEZY_TEST?.trim() !== "true") {
    return { enabled: false, mode: "test", reason: "test_mode_disabled" };
  }
  const apiKey = environment.LEMONSQUEEZY_API_KEY?.trim() || "";
  if (!apiKey) return { enabled: false, mode: "test", reason: "api_key_missing" };
  const storeId = positiveInteger(environment.LEMONSQUEEZY_STORE_ID);
  if (!storeId) return { enabled: false, mode: "test", reason: "store_id_missing" };
  const proVariant = positiveInteger(environment.LEMONSQUEEZY_PRO_VARIANT_ID);
  const lifetimeVariant = positiveInteger(environment.LEMONSQUEEZY_LIFETIME_VARIANT_ID);
  if (!proVariant || !lifetimeVariant) return { enabled: false, mode: "test", reason: "variant_missing" };
  if (!environment.LEMONSQUEEZY_WEBHOOK_SECRET?.trim()) return { enabled: false, mode: "test", reason: "webhook_secret_missing" };
  return {
    enabled: true,
    mode: "test",
    apiKey,
    storeId,
    variants: { pro: proVariant, lifetime: lifetimeVariant },
  };
}

export function getLemonSqueezyBillablePlan(planId: string | null | undefined): LemonSqueezyBillablePlanId | null {
  return isBillablePlan(planId) ? planId : null;
}

export function isLemonSqueezySubscriptionStatus(value: unknown): value is LemonSqueezySubscriptionStatus {
  return typeof value === "string" && (lemonSqueezySubscriptionStatuses as readonly string[]).includes(value);
}

/** A cancelled subscription remains valid until its provider-declared end date. */
export function hasLemonSqueezySubscriptionAccess(status: LemonSqueezySubscriptionStatus, endsAt: Date | null, now = new Date()): boolean {
  if (status === "active" || status === "on_trial") return true;
  return status === "cancelled" && Boolean(endsAt && endsAt.getTime() > now.getTime());
}

export type ParsedLemonSqueezyWebhook = {
  eventName: string;
  resourceType: "orders" | "subscriptions";
  resourceId: string;
  checkoutNonce: string;
  storeId: number;
  providerStoreId: number;
  variantId: number;
  planId: MazighoSaasPlanId;
  testMode: boolean;
  orderId: string | null;
  orderPaymentStatus: "paid" | null;
  subscription: {
    status: LemonSqueezySubscriptionStatus;
    renewsAt: Date | null;
    endsAt: Date | null;
  } | null;
};

const lemonSqueezySubscriptionEventNames = [
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
] as const;

function isLemonSqueezySubscriptionEventName(value: string): value is (typeof lemonSqueezySubscriptionEventNames)[number] {
  return (lemonSqueezySubscriptionEventNames as readonly string[]).includes(value);
}

function safeDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function stringId(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const result = String(value).trim();
  return /^[A-Za-z0-9_-]{1,120}$/.test(result) ? result : null;
}

/**
 * Parses only the minimal provider data needed to bind an event back to a
 * locally-created MAZIGHO billing checkout. It deliberately ignores customer
 * names, e-mails, card fields and provider portal URLs.
 */
export function parseLemonSqueezyBillingWebhook(payload: unknown): ParsedLemonSqueezyWebhook | null {
  if (!payload || typeof payload !== "object") return null;
  const source = payload as Record<string, unknown>;
  const meta = source.meta && typeof source.meta === "object" ? source.meta as Record<string, unknown> : null;
  const data = source.data && typeof source.data === "object" ? source.data as Record<string, unknown> : null;
  const attributes = data?.attributes && typeof data.attributes === "object" ? data.attributes as Record<string, unknown> : null;
  const firstOrderItem = attributes?.first_order_item && typeof attributes.first_order_item === "object" ? attributes.first_order_item as Record<string, unknown> : null;
  const custom = meta?.custom_data && typeof meta.custom_data === "object" ? meta.custom_data as Record<string, unknown>
    : meta?.custom && typeof meta.custom === "object" ? meta.custom as Record<string, unknown>
      : null;
  const eventName = typeof meta?.event_name === "string" ? meta.event_name.trim() : "";
  const resourceType = data?.type === "orders" || data?.type === "subscriptions" ? data.type : null;
  const resourceId = stringId(data?.id);
  const checkoutNonce = typeof custom?.mazigho_checkout_nonce === "string" ? custom.mazigho_checkout_nonce.trim() : "";
  const storeId = positiveInteger(custom?.mazigho_store_id);
  const providerStoreId = positiveInteger(attributes?.store_id);
  const variantId = positiveInteger(attributes?.variant_id ?? firstOrderItem?.variant_id);
  const planId = typeof custom?.mazigho_plan_id === "string" ? custom.mazigho_plan_id.trim() : "";
  const testMode = attributes?.test_mode === true;
  if (!eventName || !resourceType || !resourceId || !/^[A-Za-z0-9_-]{24,160}$/.test(checkoutNonce) || !storeId || !providerStoreId || !variantId || !["pro", "lifetime"].includes(planId) || !testMode) return null;

  if (resourceType === "orders") {
    if (eventName !== "order_created" || attributes?.status !== "paid") return null;
    return { eventName, resourceType, resourceId, checkoutNonce, storeId, providerStoreId, variantId, planId: planId as MazighoSaasPlanId, testMode, orderId: resourceId, orderPaymentStatus: "paid", subscription: null };
  }

  if (!isLemonSqueezySubscriptionEventName(eventName)) return null;
  const status = isLemonSqueezySubscriptionStatus(attributes?.status) ? attributes.status : null;
  if (!status) return null;
  return {
    eventName,
    resourceType,
    resourceId,
    checkoutNonce,
    storeId,
    providerStoreId,
    variantId,
    planId: planId as MazighoSaasPlanId,
    testMode,
    orderId: stringId(attributes?.order_id),
    orderPaymentStatus: null,
    subscription: { status, renewsAt: safeDate(attributes?.renews_at), endsAt: safeDate(attributes?.ends_at) },
  };
}

export type LemonSqueezyWebhookCheckoutBinding = {
  storeId: number;
  planId: string;
  status: "created" | "paid" | "void";
  lemonOrderId: string | null;
};

export type LemonSqueezyWebhookDecision =
  | { accepted: true; action: "mark_lifetime_paid" | "upsert_pro_subscription" | "already_recorded" }
  | { accepted: false; reason: "provider_store_mismatch" | "provider_variant_mismatch" | "checkout_mismatch" | "checkout_void" | "checkout_already_paid" | "unexpected_order_plan" | "unexpected_subscription_plan" };

/**
 * Applies the trust boundary before persistence: a signed provider event still
 * must match MAZIGHO's configured Test store, expected variant and one local
 * opaque checkout. The returned actions never include a store lifecycle state.
 */
export function decideLemonSqueezyWebhookApplication(input: {
  event: ParsedLemonSqueezyWebhook;
  checkout: LemonSqueezyWebhookCheckoutBinding | null;
  expectedProviderStoreId: number;
  expectedVariantId: number;
}): LemonSqueezyWebhookDecision {
  const { event, checkout, expectedProviderStoreId, expectedVariantId } = input;
  if (event.providerStoreId !== expectedProviderStoreId) return { accepted: false, reason: "provider_store_mismatch" };
  if (event.variantId !== expectedVariantId) return { accepted: false, reason: "provider_variant_mismatch" };
  if (!checkout || checkout.storeId !== event.storeId || checkout.planId !== event.planId) return { accepted: false, reason: "checkout_mismatch" };
  if (checkout.status === "void") return { accepted: false, reason: "checkout_void" };
  if (event.resourceType === "orders") {
    if (event.planId !== "lifetime" || event.orderPaymentStatus !== "paid") return { accepted: false, reason: "unexpected_order_plan" };
    if (checkout.status === "paid") return checkout.lemonOrderId === event.orderId ? { accepted: true, action: "already_recorded" } : { accepted: false, reason: "checkout_already_paid" };
    return { accepted: true, action: "mark_lifetime_paid" };
  }
  if (event.planId !== "pro" || !event.subscription) return { accepted: false, reason: "unexpected_subscription_plan" };
  return { accepted: true, action: "upsert_pro_subscription" };
}

export function shouldProcessLemonSqueezyWebhookEvent(existingStatus: "processing" | "processed" | "failed" | null | undefined) {
  return existingStatus !== "processing" && existingStatus !== "processed";
}

export function lemonSqueezyWebhookBodyHash(rawBody: Buffer | string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

export function isValidLemonSqueezySignature(rawBody: Buffer | string, signature: unknown, secret: string | undefined): boolean {
  if (typeof signature !== "string" || !secret?.trim()) return false;
  const expected = createHmac("sha256", secret.trim()).update(rawBody).digest("hex");
  const received = signature.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(received)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}
