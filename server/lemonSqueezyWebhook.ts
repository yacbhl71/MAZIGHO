import type { Request, Response } from "express";
import { applyLemonSqueezyBillingWebhook, beginLemonSqueezyWebhookEvent, completeLemonSqueezyWebhookEvent } from "./db";
import { isValidLemonSqueezySignature, lemonSqueezyWebhookBodyHash, parseLemonSqueezyBillingWebhook } from "./services/lemonSqueezyBilling";

function webhookFailureCode(error: unknown) {
  const value = error instanceof Error ? error.message : "LEMONSQUEEZY_WEBHOOK_FAILED";
  return value.slice(0, 120).replace(/[^A-Z0-9_:-]/gi, "_");
}

/**
 * Lemon Squeezy handles only MAZIGHO SaaS subscriptions in Test Mode. The raw
 * body is HMAC-verified before it is parsed; repeated deliveries are deduped
 * by SHA-256 digest and never change a store's operational lifecycle status.
 */
export async function lemonSqueezyWebhookHandler(req: Request, res: Response) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim();
  if (!secret || process.env.MAZIGHO_ENABLE_LEMONSQUEEZY_TEST?.trim() !== "true") {
    return res.status(503).json({ error: "Lemon Squeezy Test non configuré" });
  }
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  const signature = req.headers["x-signature"];
  if (!isValidLemonSqueezySignature(rawBody, signature, secret)) {
    return res.status(400).json({ error: "Signature Lemon Squeezy invalide" });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Payload Lemon Squeezy invalide" });
  }
  const event = parseLemonSqueezyBillingWebhook(payload);
  // A valid signature alone is not a sufficient tenant binding. Unsupported
  // events are accepted but ignored, so no arbitrary provider payload enters
  // the database or affects the portfolio.
  if (!event) return res.json({ received: true, ignored: true });

  const bodyHash = lemonSqueezyWebhookBodyHash(rawBody);
  try {
    const reservation = await beginLemonSqueezyWebhookEvent({
      bodyHash,
      eventName: event.eventName,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      storeId: event.storeId,
    });
    if (!reservation.shouldProcess) return res.json({ received: true, duplicate: true });
    const result = await applyLemonSqueezyBillingWebhook(event);
    if (!result.accepted) {
      await completeLemonSqueezyWebhookEvent(bodyHash, { failureCode: `LEMONSQUEEZY_${result.reason.toUpperCase()}` });
      // Keep a malformed or unbound-but-signed event retriable rather than
      // pretending that it granted rights to a different store.
      return res.status(422).json({ error: "Webhook Lemon Squeezy non associé à une boutique" });
    }
    await completeLemonSqueezyWebhookEvent(bodyHash, {});
    return res.json({ received: true });
  } catch (error) {
    await completeLemonSqueezyWebhookEvent(bodyHash, { failureCode: webhookFailureCode(error) }).catch(() => {});
    console.error("Lemon Squeezy webhook processing error", error);
    return res.status(500).json({ error: "Webhook Lemon Squeezy non traité" });
  }
}
