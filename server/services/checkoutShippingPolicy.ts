export type CheckoutShippingMode = "included" | "flat_rate";

export type CheckoutShippingPolicy = {
  mode: CheckoutShippingMode;
  /** Customer basket amount, in cents, from which flat-rate shipping becomes free. 0 disables the threshold. */
  freeShippingThresholdCents: number;
  /** Customer shipping charge, in cents, applied once per order in flat_rate mode. */
  flatShippingRateCents: number;
  /** Countries explicitly served by an owner-managed storefront. An empty list preserves legacy platform behavior. */
  servedCountries: string[];
  /** True when the requested country is allowed by the owner's delivery rule. */
  countryServed: boolean;
  /** Public operational information shown alongside the checkout estimate. */
  deliveryLeadTime: string;
  /** Public returns summary, never a refund or carrier workflow. */
  returnsSummary: string;
};

export type OwnerShippingCheckoutOverlay = {
  mode: CheckoutShippingMode;
  freeShippingThresholdCents: number;
  flatShippingRateCents: number;
  servedCountries: string[];
  deliveryLeadTime: string;
  returnsSummary: string;
};

export type CheckoutShippingCalculation = {
  mode: CheckoutShippingMode;
  productSubtotalCents: number;
  shippingAmountCents: number;
  freeShippingApplied: boolean;
};

export const DEFAULT_CHECKOUT_SHIPPING_POLICY: CheckoutShippingPolicy = {
  // Preserve MAZIGHO's current all-inclusive public-price approach until an
  // administrator explicitly elects to charge shipping separately.
  mode: "included",
  freeShippingThresholdCents: 10_000,
  flatShippingRateCents: 500,
  servedCountries: [],
  countryServed: true,
  deliveryLeadTime: "",
  returnsSummary: "",
};

const MAX_MONEY_CENTS = 10_000_000;

function parseNonNegativeCents(value: unknown, fallback: number): number {
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > MAX_MONEY_CENTS) return fallback;
  return parsed;
}

/**
 * Converts persisted string settings into a restricted checkout policy. Unknown
 * or malformed values safely fall back to MAZIGHO's all-inclusive default.
 */
export function parseCheckoutShippingPolicy(settings: Array<{ key: string; value: string }>): CheckoutShippingPolicy {
  const values = new Map(settings.map(setting => [setting.key, setting.value]));
  const mode: CheckoutShippingMode = values.get("shipping_policy") === "flat_rate" ? "flat_rate" : "included";

  return {
    mode,
    freeShippingThresholdCents: parseNonNegativeCents(
      values.get("free_shipping_threshold"),
      DEFAULT_CHECKOUT_SHIPPING_POLICY.freeShippingThresholdCents,
    ),
    flatShippingRateCents: parseNonNegativeCents(
      values.get("flat_shipping_rate"),
      DEFAULT_CHECKOUT_SHIPPING_POLICY.flatShippingRateCents,
    ),
    servedCountries: [],
    countryServed: true,
    deliveryLeadTime: "",
    returnsSummary: "",
  };
}

/**
 * Applies the owner-managed delivery rule to the public estimate and server
 * checkout check. A missing rule deliberately keeps the older platform policy
 * intact; once a boutique has selected served countries, that selection is
 * enforced rather than merely displayed in its administration panel.
 */
export function resolveCheckoutShippingPolicy(
  settings: Array<{ key: string; value: string }>,
  ownerRule?: OwnerShippingCheckoutOverlay | null,
  countryCode?: string | null,
): CheckoutShippingPolicy {
  const legacy = parseCheckoutShippingPolicy(settings);
  const servedCountries = Array.from(new Set((ownerRule?.servedCountries ?? [])
    .map(country => country.trim().toUpperCase())
    .filter(country => /^[A-Z]{2,3}$/.test(country))));
  const ownerRuleConfigured = servedCountries.length > 0;
  const requestedCountry = countryCode?.trim().toUpperCase() || "";

  return {
    mode: ownerRuleConfigured ? ownerRule!.mode : legacy.mode,
    freeShippingThresholdCents: ownerRuleConfigured ? ownerRule!.freeShippingThresholdCents : legacy.freeShippingThresholdCents,
    flatShippingRateCents: ownerRuleConfigured ? ownerRule!.flatShippingRateCents : legacy.flatShippingRateCents,
    servedCountries,
    countryServed: !ownerRuleConfigured || !requestedCountry || servedCountries.includes(requestedCountry),
    deliveryLeadTime: ownerRuleConfigured ? ownerRule!.deliveryLeadTime : "",
    returnsSummary: ownerRuleConfigured ? ownerRule!.returnsSummary : "",
  };
}

/**
 * Calculates the only customer shipping charge for a checkout. Product delivery
 * profiles are still required independently to validate destination service,
 * supplier quotes and available variants; they are never exposed here.
 */
export function calculateCheckoutShipping(
  productSubtotalCents: number,
  policy: CheckoutShippingPolicy,
): CheckoutShippingCalculation {
  if (!Number.isSafeInteger(productSubtotalCents) || productSubtotalCents < 0) {
    throw new Error("CHECKOUT_SUBTOTAL_INVALID");
  }

  if (policy.mode !== "flat_rate" || policy.flatShippingRateCents === 0) {
    return {
      mode: policy.mode,
      productSubtotalCents,
      shippingAmountCents: 0,
      freeShippingApplied: true,
    };
  }

  const thresholdReached = policy.freeShippingThresholdCents > 0
    && productSubtotalCents >= policy.freeShippingThresholdCents;

  return {
    mode: policy.mode,
    productSubtotalCents,
    shippingAmountCents: thresholdReached ? 0 : policy.flatShippingRateCents,
    freeShippingApplied: thresholdReached,
  };
}
