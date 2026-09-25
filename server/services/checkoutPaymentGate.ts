export type CheckoutPaymentGateReason = "not_enabled" | "test_key_missing" | "live_key_rejected";

export type CheckoutPaymentGate = {
  enabled: boolean;
  reason: CheckoutPaymentGateReason | null;
};

/**
 * Payment remains closed by default. A test checkout can only be enabled by an
 * explicit server-side flag together with a Stripe Test key; a Live key can
 * never open this path.
 */
export function getCheckoutPaymentGate(environment: Record<string, string | undefined> = process.env): CheckoutPaymentGate {
  const key = environment.STRIPE_SECRET_KEY?.trim() || "";
  if (key.startsWith("sk_live_")) return { enabled: false, reason: "live_key_rejected" };
  if (!key.startsWith("sk_test_")) return { enabled: false, reason: "test_key_missing" };
  if (environment.MAZIGHO_ENABLE_STRIPE_TEST_CHECKOUT?.trim() !== "true") {
    return { enabled: false, reason: "not_enabled" };
  }
  return { enabled: true, reason: null };
}
