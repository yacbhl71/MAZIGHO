import { describe, expect, it } from "vitest";
import { getCheckoutPaymentGate } from "./checkoutPaymentGate";
import { getStripeConnectModeAvailability } from "./stripeConnectMode";

describe("checkout payment gate", () => {
  it("keeps both environments closed when their own configuration is absent", () => {
    expect(getCheckoutPaymentGate("test", {})).toEqual({ enabled: false, reason: "test_mode_disabled" });
    expect(getCheckoutPaymentGate("live", {})).toEqual({ enabled: false, reason: "live_mode_disabled" });
  });

  it("allows an explicitly enabled Stripe Test checkout only with a Test key", () => {
    expect(getCheckoutPaymentGate("test", {
      STRIPE_SECRET_KEY: "sk_test_example",
      MAZIGHO_ENABLE_STRIPE_TEST_CONNECT: "true",
      MAZIGHO_ENABLE_STRIPE_TEST_CHECKOUT: "true",
    })).toEqual({ enabled: true, reason: null });
  });

  it("keeps Test checkout closed when its primary key is not Test", () => {
    expect(getCheckoutPaymentGate("test", {
      STRIPE_SECRET_KEY: "sk_live_example",
      MAZIGHO_ENABLE_STRIPE_TEST_CONNECT: "true",
      MAZIGHO_ENABLE_STRIPE_TEST_CHECKOUT: "true",
    })).toEqual({ enabled: false, reason: "test_key_missing" });
  });

  it("requires a distinct live key and both explicit production flags", () => {
    const environment = {
      STRIPE_SECRET_KEY: "sk_test_existing",
      STRIPE_LIVE_SECRET_KEY: "sk_live_separate",
      MAZIGHO_ENABLE_STRIPE_LIVE_CONNECT: "true",
      MAZIGHO_ENABLE_STRIPE_LIVE_CHECKOUT: "true",
    };
    expect(getStripeConnectModeAvailability("live", environment)).toEqual({ available: true, reason: null });
    expect(getCheckoutPaymentGate("live", environment)).toEqual({ enabled: true, reason: null });
    expect(getCheckoutPaymentGate("live", { ...environment, MAZIGHO_ENABLE_STRIPE_LIVE_CHECKOUT: "false" })).toEqual({ enabled: false, reason: "live_mode_disabled" });
  });
});
