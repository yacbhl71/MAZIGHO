import type Stripe from "stripe";
import type { StripeConnectMode } from "./stripeConnectMode";

export type StripeConnectV2AccountInput = {
  storeId: number;
  mode: StripeConnectMode;
  ownerEmail: string | null | undefined;
  primaryDomain: string;
  countryCode: string;
};

/**
 * Builds the current Stripe Accounts v2 payload for MAZIGHO's direct-charge
 * model. Each merchant is the seller of record, Stripe collects its payment
 * fees from that merchant, and Stripe carries that merchant's negative-balance
 * liability. MAZIGHO's application fee remains limited to the explicit store
 * commission calculated at checkout.
 */
export function buildStripeConnectV2AccountParams(input: StripeConnectV2AccountInput): Stripe.V2.Core.AccountCreateParams {
  const contactEmail = input.ownerEmail?.trim();
  if (!contactEmail) throw new Error("STRIPE_CONNECT_OWNER_EMAIL_MISSING");

  return {
    contact_email: contactEmail,
    display_name: input.primaryDomain,
    identity: { country: input.countryCode.trim().toLowerCase() },
    dashboard: "full",
    configuration: {
      merchant: {
        capabilities: {
          card_payments: { requested: true },
        },
      },
    },
    defaults: {
      responsibilities: {
        fees_collector: "stripe",
        losses_collector: "stripe",
      },
    },
    metadata: {
      mazigho_store_id: String(input.storeId),
      mazigho_mode: input.mode,
      mazigho_payment_model: "merchant_direct_charge",
    },
    include: ["configuration.merchant", "defaults", "requirements"],
  };
}
