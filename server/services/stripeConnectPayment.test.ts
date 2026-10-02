import { describe, expect, it } from "vitest";
import { calculateMazighoApplicationFee, getStripeConnectPaymentReadiness } from "./stripeConnectPayment";

describe("Stripe Connect direct charge policy", () => {
  const enabledEnvironment = { STRIPE_SECRET_KEY: "sk_test_platform", MAZIGHO_ENABLE_STRIPE_TEST_CONNECT: "true" };
  const readyAccount = { accountId: "acct_testBoutique", onboardingComplete: true, chargesEnabled: true, payoutsEnabled: true, detailsSubmitted: true };

  it("applies the official FREE, BASIC, PRO and LIFETIME commission rates in cents", () => {
    expect(calculateMazighoApplicationFee(10_000, 250)).toBe(250);
    expect(calculateMazighoApplicationFee(10_000, 100)).toBe(100);
    expect(calculateMazighoApplicationFee(10_000, 0)).toBe(0);
    expect(calculateMazighoApplicationFee(999, 250)).toBe(24);
  });

  it("opens only a completed Test account with an official plan", () => {
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "free", account: readyAccount })).toMatchObject({ enabled: true, accountId: "acct_testBoutique", commissionRateBps: 250, planId: "free" });
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "basic", account: readyAccount })).toMatchObject({ enabled: true, commissionRateBps: 100, planId: "basic" });
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "pro", account: readyAccount })).toMatchObject({ enabled: true, commissionRateBps: 100, planId: "pro" });
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "lifetime", account: readyAccount })).toMatchObject({ enabled: true, commissionRateBps: 0, planId: "lifetime" });
  });

  it("uses a validated Studio exception only for the selected store checkout", () => {
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "pro", commissionRateBps: 0, account: readyAccount }))
      .toMatchObject({ enabled: true, commissionRateBps: 0, planId: "pro" });
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "basic", commissionRateBps: 375, account: readyAccount }))
      .toMatchObject({ enabled: true, commissionRateBps: 375, planId: "basic" });
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "basic", commissionRateBps: 10_001, account: readyAccount }))
      .toEqual({ enabled: false, reason: "store_commission_invalid" });
  });

  it("keeps checkout closed for absent plan, incomplete account or a live key", () => {
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: null, account: readyAccount })).toEqual({ enabled: false, reason: "store_plan_missing" });
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "basic", account: { ...readyAccount, chargesEnabled: false } })).toEqual({ enabled: false, reason: "connect_onboarding_incomplete" });
    expect(getStripeConnectPaymentReadiness({ environment: enabledEnvironment, planId: "basic", account: { ...readyAccount, payoutsEnabled: false } })).toEqual({ enabled: false, reason: "connect_payouts_incomplete" });
    expect(getStripeConnectPaymentReadiness({ environment: { STRIPE_SECRET_KEY: "sk_live_never", MAZIGHO_ENABLE_STRIPE_TEST_CONNECT: "true" }, planId: "basic", account: readyAccount })).toEqual({ enabled: false, reason: "platform_test_key_missing" });
  });

  it("requires a separate enabled Production configuration and merchant account", () => {
    const production = {
      STRIPE_SECRET_KEY: "sk_test_kept_separate",
      STRIPE_LIVE_SECRET_KEY: "sk_live_platform",
      MAZIGHO_ENABLE_STRIPE_LIVE_CONNECT: "true",
    };
    expect(getStripeConnectPaymentReadiness({ mode: "live", environment: production, planId: "pro", account: readyAccount }))
      .toMatchObject({ enabled: true, accountId: "acct_testBoutique", commissionRateBps: 100 });
    expect(getStripeConnectPaymentReadiness({ mode: "live", environment: { ...production, MAZIGHO_ENABLE_STRIPE_LIVE_CONNECT: "false" }, planId: "pro", account: readyAccount }))
      .toEqual({ enabled: false, reason: "platform_live_mode_disabled" });
    expect(getStripeConnectPaymentReadiness({ mode: "live", environment: { STRIPE_SECRET_KEY: "sk_test_kept_separate", MAZIGHO_ENABLE_STRIPE_LIVE_CONNECT: "true" }, planId: "pro", account: readyAccount }))
      .toEqual({ enabled: false, reason: "platform_live_key_missing" });
  });
});
