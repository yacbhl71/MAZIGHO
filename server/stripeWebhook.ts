import type { Request, Response } from "express";
import Stripe from "stripe";
import { confirmStripeConnectSessionOwner, finalizePaidOrderRedemption, getOrderForStripeSession, markOrderPaidByStripeSession, queueCjSandboxPreparationForPaidOrder, releaseExpiredStripePendingOrder, setSettingValue, storeOdooSaleOrderId, storeStripeShippingAddress } from "./db";
import { syncOrderToOdoo } from "./services/odoo";
import { sendOrderConfirmationForStripeSession } from "./emails";
import { getStripeConnectCredentials, type StripeConnectMode } from "./services/stripeConnectMode";

// Best-effort synchronisation of a paid order to Odoo. Never throws so the
// Stripe webhook keeps returning 200 even when Odoo is down or not configured.
async function syncPaidOrderToOdoo(sessionId: string) {
  try {
    const snapshot = await getOrderForStripeSession(sessionId);
    if (!snapshot) return;
    const { order, items } = snapshot;
    const result = await syncOrderToOdoo({
      orderReference: `MAZIGHO-${order.id}`,
      customer: { name: order.userName || order.userEmail || "Client MAZIGHO", email: order.userEmail },
      lines: [
        ...items.map(item => ({
          name: item.productNameSnapshot || item.productName || "Article MAZIGHO",
          quantity: item.quantity,
          priceUnit: Math.round(item.priceAtPurchase) / 100,
          reference: item.productId ? `MAZIGHO-${item.productId}` : null,
        })),
        ...(order.customerShippingAmount > 0 ? [{
          name: "Livraison",
          quantity: 1,
          priceUnit: Math.round(order.customerShippingAmount) / 100,
          reference: "MAZIGHO-SHIPPING",
        }] : []),
      ],
      currency: order.currencyCode || "CHF",
      note: order.shippingAddress ? `Adresse de livraison:\n${order.shippingAddress}` : undefined,
    });
    if (result.synced) {
      if (result.saleOrderId) await storeOdooSaleOrderId(order.id, result.saleOrderId, order.storeId);
      console.log(`[Odoo] Order MAZIGHO-${order.id} synced (sale.order ${result.saleOrderId ?? "existing"}, partner ${result.partnerId ?? "existing"}).`);
      setSettingValue("odoo.last_sync_at", new Date().toISOString(), "Dernière synchronisation Odoo réussie").catch(() => {});
    } else if (!result.skipped) {
      console.error(`[Odoo] Order MAZIGHO-${order.id} sync failed: ${result.reason}`);
    }
  } catch (error) {
    console.error("[Odoo] Unexpected sync error", error);
  }
}

function extractStripeShippingAddress(session: Stripe.Checkout.Session) {
  const legacyDetails = (session as Stripe.Checkout.Session & { shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null }).shipping_details;
  const details = session.collected_information?.shipping_details ?? legacyDetails ?? null;
  const address = details?.address;
  return {
    name: details?.name ?? null,
    phone: session.customer_details?.phone ?? null,
    email: session.customer_details?.email ?? session.customer_email ?? null,
    line1: address?.line1 ?? null,
    line2: address?.line2 ?? null,
    city: address?.city ?? null,
    state: address?.state ?? null,
    postalCode: address?.postal_code ?? null,
    countryCode: address?.country ?? null,
  };
}

export function isVerifiedPaidStripeSession(session: Stripe.Checkout.Session, mode: StripeConnectMode): boolean {
  return session.livemode === (mode === "live") && session.mode === "payment" && session.payment_status === "paid";
}

export function isVerifiedPaidStripeTestSession(session: Stripe.Checkout.Session): boolean {
  return isVerifiedPaidStripeSession(session, "test");
}

const stripeConnectPaidCheckoutEventTypes = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);
const stripeConnectExpiredCheckoutEventTypes = new Set(["checkout.session.expired"]);

export function isStripeConnectPaidCheckoutEventType(eventType: string) {
  return stripeConnectPaidCheckoutEventTypes.has(eventType);
}

export function isStripeConnectExpiredCheckoutEventType(eventType: string) {
  return stripeConnectExpiredCheckoutEventTypes.has(eventType);
}

/**
 * Direct Charge events are emitted in the connected-account scope. A missing
 * or malformed top-level account therefore proves neither the merchant nor
 * the tenant, and must never advance a customer order.
 */
export function getStripeConnectWebhookAccount(event: Stripe.Event): string | null {
  return typeof event.account === "string" && /^acct_[A-Za-z0-9]+$/.test(event.account)
    ? event.account
    : null;
}

export async function completePaidStripeOrder(
  session: Stripe.Checkout.Session,
  options: { mode?: StripeConnectMode; sendCustomerEmail?: boolean } = {},
) {
  const mode = options.mode ?? "test";
  // The Stripe event has no storefront host. Resolve its tenant only from the
  // durable local order before persisting any downstream operational metadata.
  const snapshot = await getOrderForStripeSession(session.id);
  if (!snapshot) return;
  await storeStripeShippingAddress(session.id, extractStripeShippingAddress(session), snapshot.order.storeId);
  // Direct Charges belong to independent client boutiques. Their paid order
  // never enters MAZIGHO's Odoo or supplier preparation integrations.
  const isClientDirectCharge = ["stripe_connect_test", "stripe_connect_live"].includes(snapshot.order.paymentMethod || "");
  const tasks = isClientDirectCharge
    ? [finalizePaidOrderRedemption(session.id)]
    : [finalizePaidOrderRedemption(session.id), syncPaidOrderToOdoo(session.id), queueCjSandboxPreparationForPaidOrder(session.id)];
  const results = await Promise.allSettled(tasks);
  results.forEach((result, index) => {
    if (result.status === "rejected") console.error(`[Stripe] downstream task ${index + 1} failed`, result.reason);
  });
  // Reconciliation may be retried by the webhook or the checkout return path.
  // The customer confirmation is only sent on the first durable transition.
  const emailFlag = mode === "live" ? "MAZIGHO_ENABLE_STRIPE_LIVE_ORDER_EMAILS" : "MAZIGHO_ENABLE_STRIPE_TEST_ORDER_EMAILS";
  if (options.sendCustomerEmail && process.env[emailFlag]?.trim() === "true") {
    sendOrderConfirmationForStripeSession(session.id).catch(err => console.error("[email:order-confirmation]", err));
  }
}

async function handleStripeWebhook(mode: StripeConnectMode, req: Request, res: Response) {
  const credentials = getStripeConnectCredentials(mode);
  // Test events stay verifiable with their configured endpoint secret even if
  // checkout is temporarily paused. Production additionally needs its explicit
  // server-side activation flag before accepting any live event.
  if ((mode === "live" && !credentials.enabled) || !credentials.keyValid || !credentials.webhookValid) {
    return res.status(503).json({ error: `Stripe ${mode === "live" ? "Production" : "Test"} non configuré` });
  }

  const stripe = new Stripe(credentials.secretKey);
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") return res.status(400).json({ error: "Signature Stripe manquante" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, credentials.webhookSecret);
  } catch (error) {
    console.error(`Stripe ${mode} webhook signature error`, error);
    return res.status(400).json({ error: "Signature Stripe invalide" });
  }

  try {
    if (isStripeConnectPaidCheckoutEventType(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (isVerifiedPaidStripeSession(session, mode)) {
        const connectedAccountId = getStripeConnectWebhookAccount(event);
        if (!connectedAccountId) {
          console.warn("[Stripe Connect] Ignored checkout event without connected-account scope", { mode, eventId: event.id, eventType: event.type });
          return res.json({ received: true, ignored: true });
        }
        const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
        const ownership = await confirmStripeConnectSessionOwner({ mode, sessionId: session.id, stripeAccountId: connectedAccountId, paymentIntentId });
        if (!ownership.accepted) {
          console.warn("[Stripe Connect] Ignored webhook for an unbound or cross-store session", { mode, eventId: event.id, connectedAccountId });
          return res.json({ received: true, ignored: true });
        }
        const paid = await markOrderPaidByStripeSession(session.id);
        await completePaidStripeOrder(session, { mode, sendCustomerEmail: paid.justPaid });
      }
    } else if (isStripeConnectExpiredCheckoutEventType(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.livemode === (mode === "live") && session.mode === "payment") {
        const connectedAccountId = getStripeConnectWebhookAccount(event);
        if (!connectedAccountId) {
          console.warn("[Stripe Connect] Ignored expiry event without connected-account scope", { mode, eventId: event.id, eventType: event.type });
          return res.json({ received: true, ignored: true });
        }
        const ownership = await confirmStripeConnectSessionOwner({ mode, sessionId: session.id, stripeAccountId: connectedAccountId });
        if (!ownership.accepted) {
          console.warn("[Stripe Connect] Ignored expiry event for an unbound or cross-store session", { mode, eventId: event.id, connectedAccountId });
          return res.json({ received: true, ignored: true });
        }
        await releaseExpiredStripePendingOrder({ mode, sessionId: session.id, stripeAccountId: connectedAccountId });
      }
    }
    return res.json({ received: true });
  } catch (error) {
    // A failure before the paid transition is durable must remain retriable by
    // Stripe. Downstream operational tasks are contained above.
    console.error(`Stripe ${mode} webhook processing error`, error);
    return res.status(500).json({ error: "Webhook non traité" });
  }
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  return handleStripeWebhook("test", req, res);
}

/** Separate endpoint and secret for genuine charges. */
export async function stripeLiveWebhookHandler(req: Request, res: Response) {
  return handleStripeWebhook("live", req, res);
}
