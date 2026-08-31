import type { Request, Response } from "express";
import Stripe from "stripe";
import { finalizePaidOrderRedemption, getOrderForStripeSession, markOrderPaidByStripeSession } from "./db";
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
        name: item.productName || "Article MAZIGHO",
        quantity: item.quantity,
        priceUnit: Math.round(item.priceAtPurchase) / 100,
        reference: item.productId ? `MAZIGHO-${item.productId}` : null,
      })),
      currency: "CHF",
      note: order.shippingAddress ? `Adresse de livraison:\n${order.shippingAddress}` : undefined,
    });
    if (result.synced) {
      console.log(`[Odoo] Order MAZIGHO-${order.id} synced (sale.order ${result.saleOrderId}, partner ${result.partnerId}).`);
    } else if (!result.skipped) {
      console.error(`[Odoo] Order MAZIGHO-${order.id} sync failed: ${result.reason}`);
    }
  } catch (error) {
    console.error("[Odoo] Unexpected sync error", error);
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
      if (session.mode === "payment" && session.payment_status === "paid") {
        const paid = await markOrderPaidByStripeSession(session.id);
        if (paid.justPaid) {
          await finalizePaidOrderRedemption(session.id);
          await syncPaidOrderToOdoo(session.id);
          sendOrderConfirmationForStripeSession(session.id).catch(err => console.error("[email:order-confirmation]", err));
        }
      }
    }
    return res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error", error);
    return res.status(500).json({ error: "Webhook non traité" });
  }
}
