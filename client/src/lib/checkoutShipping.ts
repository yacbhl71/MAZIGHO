export type PublicCheckoutShippingPolicy = {
  mode: "included" | "flat_rate";
  freeShippingThresholdCents: number;
  flatShippingRateCents: number;
};

/**
 * Visual-only estimate for the cart and checkout. Stripe Checkout recomputes
 * this amount on the server from the persisted policy before charging.
 */
export function calculateCheckoutShippingEstimate(
  subtotalCents: number,
  policy: PublicCheckoutShippingPolicy | undefined,
): { shippingAmountCents: number; freeShippingApplied: boolean } {
  if (!policy || policy.mode !== "flat_rate" || policy.flatShippingRateCents <= 0) {
    return { shippingAmountCents: 0, freeShippingApplied: true };
  }

  const freeShippingApplied = policy.freeShippingThresholdCents > 0
    && subtotalCents >= policy.freeShippingThresholdCents;

  return {
    shippingAmountCents: freeShippingApplied ? 0 : policy.flatShippingRateCents,
    freeShippingApplied,
  };
}
