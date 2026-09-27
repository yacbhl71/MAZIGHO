import { getStripeConnectModeAvailability, getStripeConnectCredentials, type StripeConnectMode } from "./stripeConnectMode";

export type CheckoutPaymentGateReason =
  | "test_mode_disabled"
  | "test_key_missing"
  | "live_mode_disabled"
  | "live_key_missing";

export type CheckoutPaymentGate = {
  enabled: boolean;
  reason: CheckoutPaymentGateReason | null;
};

/**
 * Checkout is closed unless its exact Stripe environment is explicitly enabled.
 * Live credentials use dedicated variables and cannot reuse or replace the Test
 * credentials that have already been used for rehearsal checkouts.
 */
export function getCheckoutPaymentGate(
  mode: StripeConnectMode = "test",
  environment: Record<string, string | undefined> = process.env,
): CheckoutPaymentGate {
  const availability = getStripeConnectModeAvailability(mode, environment);
  if (!availability.available) return { enabled: false, reason: availability.reason };

  const credentials = getStripeConnectCredentials(mode, environment);
  const checkoutEnabled = mode === "live"
    ? environment.MAZIGHO_ENABLE_STRIPE_LIVE_CHECKOUT?.trim() === "true"
    : environment.MAZIGHO_ENABLE_STRIPE_TEST_CHECKOUT?.trim() === "true";
  if (!checkoutEnabled) return { enabled: false, reason: `${mode}_mode_disabled` };
  if (!credentials.keyValid) return { enabled: false, reason: `${mode}_key_missing` };
  return { enabled: true, reason: null };
}
