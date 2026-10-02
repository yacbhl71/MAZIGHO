import Stripe from "stripe";
import { getStripeConnectCredentials, type StripeConnectMode } from "./stripeConnectMode";

export type StaleStripeCheckoutCandidate = {
  orderId: number;
  storeId: number;
  sessionId: string;
  stripeAccountId: string;
  mode: StripeConnectMode;
};

/** Never infer an expired session from an order's age: a webhook may be delayed. */
export function isConfirmedExpiredCheckout(session: Pick<Stripe.Checkout.Session, "id" | "status" | "mode" | "livemode" | "payment_status" | "metadata">, candidate: StaleStripeCheckoutCandidate) {
  return session.id === candidate.sessionId
    && session.mode === "payment"
    && session.livemode === (candidate.mode === "live")
    && session.status === "expired"
    && session.payment_status === "unpaid"
    && session.metadata?.store_id === String(candidate.storeId)
    && session.metadata?.order_id === String(candidate.orderId)
    && session.metadata?.stripe_connect_mode === candidate.mode;
}

/** Read-only Stripe check. Credential availability is independent of the checkout creation flag. */
export async function verifyStaleStripeCheckout(candidate: StaleStripeCheckoutCandidate): Promise<boolean> {
  const credentials = getStripeConnectCredentials(candidate.mode);
  if (!credentials.keyValid) return false;
  const stripe = new Stripe(credentials.secretKey, { timeout: 2500, maxNetworkRetries: 0 });
  const session = await stripe.checkout.sessions.retrieve(candidate.sessionId, {}, { stripeAccount: candidate.stripeAccountId });
  return isConfirmedExpiredCheckout(session, candidate);
}
