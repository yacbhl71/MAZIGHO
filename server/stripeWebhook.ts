import type { Request, Response } from "express";
import Stripe from "stripe";
import { finalizePaidOrderRedemption, getOrderForStripeSession, markOrderPaidByStripeSession, queueCjSandboxPreparationForPaidOrder, setSettingValue, storeOdooSaleOrderId, storeStripeShippingAddress } from "./db";
import { syncOrderToOdoo } from "./services/odoo";
import { sendOrderConfirmationForStripeSession } from "./emails";

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
      lines: items.map(item => ({
        name: item.productNameSnapshot || item.productName || "Article MAZIGHO",
        quantity: item.quantity,
        priceUnit: Math.round(item.priceAtPurchase) / 100,
        reference: item.productId ? `MAZIGHO-${item.productId}` : null,
      })),
      currency: "CHF",
      note: order.shippingAddress ? `Adresse de livraison:\n${order.shippingAddress}` : undefined,
    });
    if (result.synced) {
      if (result.saleOrderId) await storeOdooSaleOrderId(order.id, result.saleOrderId);
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

export function isVerifiedPaidStripeTestSession(session: Stripe.Checkout.Session): boolean {
  // The MAZIGHO checkout is intentionally limited to Stripe Test Mode. Never
  // trust a client flag: Stripe itself must confirm a non-live payment session.
  return session.livemode === false && session.mode === "payment" && session.payment_status === "paid";
}

export async function completePaidStripeOrder(session: Stripe.Checkout.Session, options: { sendCustomerEmail?: boolean } = {}) {
  // Address capture is local and precedes Odoo/CJ handoff. If it fails, the
  // subsequent preparation is allowed to surface a visible exception instead
  // of guessing a delivery address.
  await storeStripeShippingAddress(session.id, extractStripeShippingAddress(session));
  const tasks = [
    finalizePaidOrderRedemption(session.id),
    syncPaidOrderToOdoo(session.id),
    queueCjSandboxPreparationForPaidOrder(session.id),
  ];
  const results = await Promise.allSettled(tasks);
  results.forEach((result, index) => {
    if (result.status === "rejected") console.error(`[Stripe] downstream task ${index + 1} failed`, result.reason);
  });
  // Reconciliation may be retried by the webhook, the checkout return route,
  // or an authorised test operator. The customer confirmation is sent only
  // on the first durable payment transition.
  if (options.sendCustomerEmail) {
    sendOrderConfirmationForStripeSession(session.id).catch(err => console.error("[email:order-confirmation]", err));
  }
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secretKey?.startsWith("sk_test_") || !webhookSecret?.startsWith("whsec_")) {
    return res.status(503).json({ error: "Stripe Test Mode non configuré" });
  }

  const stripe = new Stripe(secretKey);
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") return res.status(400).json({ error: "Signature Stripe manquante" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature error", error);
    return res.status(400).json({ error: "Signature Stripe invalide" });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (isVerifiedPaidStripeTestSession(session)) {
        const paid = await markOrderPaidByStripeSession(session.id);
        // Re-run the idempotent downstream handoff even after a Stripe retry:
        // an earlier Odoo or CJ queue failure must not leave a paid test order
        // stranded. Only the first durable transition sends an e-mail.
        await completePaidStripeOrder(session, { sendCustomerEmail: paid.justPaid });
      }
    }
    return res.json({ received: true });
  } catch (error) {
    // A failure before the paid transition is durable must remain retriable by
    // Stripe. Failures in Odoo/CJ are already contained in completePaidStripeOrder.
    console.error("Stripe webhook processing error", error);
    return res.status(500).json({ error: "Webhook non traité" });
  }
}
