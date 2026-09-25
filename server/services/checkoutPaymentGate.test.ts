import { describe, expect, it } from "vitest";
import { getCheckoutPaymentGate } from "./checkoutPaymentGate";

describe("checkout payment gate", () => {
  it("keeps checkout closed when no explicit test mode is enabled", () => {
    expect(getCheckoutPaymentGate({})).toEqual({ enabled: false, reason: "test_key_missing" });
    expect(getCheckoutPaymentGate({ STRIPE_SECRET_KEY: "sk_test_example" })).toEqual({ enabled: false, reason: "not_enabled" });
  });

  it("allows only an explicitly enabled Stripe Test key", () => {
    expect(getCheckoutPaymentGate({
      STRIPE_SECRET_KEY: "sk_test_example",
      MAZIGHO_ENABLE_STRIPE_TEST_CHECKOUT: "true",
    })).toEqual({ enabled: true, reason: null });
  });

  it("always rejects a Stripe Live key, even when the test flag is set", () => {
    expect(getCheckoutPaymentGate({
      STRIPE_SECRET_KEY: "sk_live_example",
      MAZIGHO_ENABLE_STRIPE_TEST_CHECKOUT: "true",
    })).toEqual({ enabled: false, reason: "live_key_rejected" });
  });
});
