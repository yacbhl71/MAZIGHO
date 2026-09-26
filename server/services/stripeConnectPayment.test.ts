import { describe, expect, it } from "vitest";
import { calculateMazighoApplicationFee, getStripeConnectPaymentReadiness } from "./stripeConnectPayment";

describe("Stripe Connect direct charge policy", () => {
  const enabledEnvironment = { STRIPE_SECRET_KEY: "sk_test_platform", MAZIGHO_ENABLE_STRIPE_TEST_CONNECT: "true" };
  const readyAccount = { accountId: "acct_testBoutique", onboardingComplete: true, chargesEnabled: true, detailsSubmitted: true };

  it("applies the official BASIC, PRO and LIFETIME commission rates in cents", () => {
    expect(calculateMazighoApplicationFee(10_000, 250)).toBe(250);
    expect(calculateMazighoApplicationFee(10_000, 100)).toBe(100);
    expect(calculateMazighoApplicationFee(10_000, 0)).toBe(0);
    expect(calculateMazighoApplicationFee(999, 250)).toBe(24);
  });

  it("opens only a completed Test account with an official plan", () => {
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "basic", account: readyAccount })).toMatchObject({ enabled: true, accountId: "acct_testBoutique", commissionRateBps: 250, planId: "basic" });
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "pro", account: readyAccount })).toMatchObject({ enabled: true, commissionRateBps: 100, planId: "pro" });
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "lifetime", account: readyAccount })).toMatchObject({ enabled: true, commissionRateBps: 0, planId: "lifetime" });
  });

  it("keeps checkout closed for absent plan, incomplete account or a live key", () => {
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: null, account: readyAccount })).toEqual({ enabled: false, reason: "store_plan_missing" });
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "basic", account: { ...readyAccount, chargesEnabled: false } })).toEqual({ enabled: false, reason: "connect_onboarding_incomplete" });
    expect(getStripeConnectPaymentReadiness({ environment: { STRIPE_SECRET_KEY: "sk_live_never", MAZIGHO_ENABLE_STRIPE_TEST_CONNECT: "true" }, planId: "basic", account: readyAccount })).toEqual({ enabled: false, reason: "platform_test_key_missing" });
  });
});
