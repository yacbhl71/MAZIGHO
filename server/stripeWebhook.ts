import type { Request, Response } from "express";
import Stripe from "stripe";
import { markOrderPaidByStripeSession } from "./db";

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
        await markOrderPaidByStripeSession(session.id);
      }
    }
    return res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing error", error);
    return res.status(500).json({ error: "Webhook non traité" });
  }
}
