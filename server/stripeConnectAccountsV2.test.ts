import { describe, expect, it } from "vitest";
import { buildStripeConnectV2AccountParams } from "./services/stripeConnectAccountsV2";

describe("Stripe Connect Accounts v2 payload", () => {
  it("keeps the direct-merchant model and requests cards only", () => {
    expect(buildStripeConnectV2AccountParams({
      storeId: 72,
      mode: "test",
      ownerEmail: "owner@example.test",
      primaryDomain: "recette-paiement.mazigho.ch",
      countryCode: "CH",
    })).toEqual({
      contact_email: "owner@example.test",
      display_name: "recette-paiement.mazigho.ch",
      identity: { country: "ch" },
      dashboard: "full",
      configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
      defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe" } },
      metadata: {
        mazigho_store_id: "72",
        mazigho_mode: "test",
        mazigho_payment_model: "merchant_direct_charge",
      },
      include: ["configuration.merchant", "defaults", "requirements"],
    });
  });

  it("does not create a merchant account without its owner email", () => {
    expect(() => buildStripeConnectV2AccountParams({
      storeId: 72,
      mode: "test",
      ownerEmail: " ",
      primaryDomain: "recette-paiement.mazigho.ch",
      countryCode: "CH",
    })).toThrow("STRIPE_CONNECT_OWNER_EMAIL_MISSING");
  });
});
