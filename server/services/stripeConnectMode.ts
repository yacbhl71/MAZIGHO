export const stripeConnectModes = ["test", "live"] as const;
export type StripeConnectMode = (typeof stripeConnectModes)[number];

export function isStripeConnectMode(value: unknown): value is StripeConnectMode {
  return value === "test" || value === "live";
}

export function getStripeConnectCredentials(
  mode: StripeConnectMode,
  environment: Record<string, string | undefined> = process.env,
) {
  if (mode === "live") {
    const secretKey = environment.STRIPE_LIVE_SECRET_KEY?.trim() || "";
    const webhookSecret = environment.STRIPE_LIVE_WEBHOOK_SECRET?.trim() || "";
    return {
      mode,
      enabled: environment.MAZIGHO_ENABLE_STRIPE_LIVE_CONNECT?.trim() === "true",
      secretKey,
      webhookSecret,
      keyValid: secretKey.startsWith("sk_live_"),
      webhookValid: webhookSecret.startsWith("whsec_"),
    };
  }

  const secretKey = environment.STRIPE_SECRET_KEY?.trim() || "";
  const webhookSecret = environment.STRIPE_WEBHOOK_SECRET?.trim() || "";
  return {
    mode,
    enabled: environment.MAZIGHO_ENABLE_STRIPE_TEST_CONNECT?.trim() === "true",
    secretKey,
    webhookSecret,
    keyValid: secretKey.startsWith("sk_test_"),
    webhookValid: webhookSecret.startsWith("whsec_"),
  };
}

/**
 * Production uses intentionally separate variable names so a test key can
 * never be silently promoted. Both the explicit server flag and a matching
 * key are required before any live Stripe API call can be made.
 */
export function getStripeConnectModeAvailability(
  mode: StripeConnectMode,
  environment: Record<string, string | undefined> = process.env,
) {
  const credentials = getStripeConnectCredentials(mode, environment);
  if (!credentials.enabled) return { available: false as const, reason: `${mode}_mode_disabled` as const };
  if (!credentials.keyValid) return { available: false as const, reason: `${mode}_key_missing` as const };
  return { available: true as const, reason: null };
}
