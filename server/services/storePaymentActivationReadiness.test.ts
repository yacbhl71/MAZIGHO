import { describe, expect, it } from "vitest";
import { buildStorePaymentActivationReadiness } from "./storePaymentActivationReadiness";

const readyStripe = {
  schemaReady: true,
  plan: { id: "pro" as const, name: "PRO", commissionRateBps: 100 },
  account: {
    accountId: "acct_storeTest",
    onboardingComplete: true,
    detailsSubmitted: true,
    chargesEnabled: true,
    payoutsEnabled: true,
  },
  paymentReadiness: { enabled: true as const },
};

describe("buildStorePaymentActivationReadiness", () => {
  it("keeps payment preparation blocked while storefront prerequisites are incomplete", () => {
    const result = buildStorePaymentActivationReadiness({ storefrontPrepared: false, stripe: readyStripe });

    expect(result).toMatchObject({
      stage: "storefront_setup_required",
      testCheckoutReady: false,
      liveReviewReady: false,
      liveActivationExecuted: false,
    });
    expect(result.checks.find(check => check.id === "storefront")).toMatchObject({ state: "attention" });
  });

  it("requires a tenant plan and a seller account before any checkout validation", () => {
    const withoutPlan = buildStorePaymentActivationReadiness({ storefrontPrepared: true, stripe: { ...readyStripe, plan: null } });
    const withoutAccount = buildStorePaymentActivationReadiness({ storefrontPrepared: true, stripe: { ...readyStripe, account: null } });

    expect(withoutPlan.stage).toBe("plan_required");
    expect(withoutAccount.stage).toBe("seller_account_required");
    expect(withoutAccount.checks.find(check => check.id === "seller_capabilities")).toMatchObject({ state: "pending" });
  });

  it("requires Stripe capabilities and test configuration before test checkout", () => {
    const incompleteAccount = buildStorePaymentActivationReadiness({
      storefrontPrepared: true,
      stripe: { ...readyStripe, account: { ...readyStripe.account, payoutsEnabled: false } },
    });
    const disabledEnvironment = buildStorePaymentActivationReadiness({
      storefrontPrepared: true,
      stripe: { ...readyStripe, paymentReadiness: { enabled: false as const, reason: "platform_test_mode_disabled" } },
    });

    expect(incompleteAccount.stage).toBe("seller_capabilities_required");
    expect(disabledEnvironment.stage).toBe("test_environment_required");
    expect(disabledEnvironment.testCheckoutReady).toBe(false);
  });

  it("marks a completed test configuration as ready for a controlled checkout only", () => {
    const result = buildStorePaymentActivationReadiness({ storefrontPrepared: true, stripe: readyStripe });

    expect(result).toMatchObject({
      stage: "test_checkout_ready",
      testCheckoutReady: true,
      liveReviewReady: false,
      liveActivationExecuted: false,
    });
  });
});
