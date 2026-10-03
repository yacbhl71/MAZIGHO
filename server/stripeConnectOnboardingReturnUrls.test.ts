import { describe, expect, it } from "vitest";
import { getStripeConnectOnboardingReturnUrls } from "./services/stripeConnectOnboardingReturnUrls";

describe("Stripe Connect onboarding return URLs", () => {
  it("returns to the active boutique management panel", () => {
    expect(getStripeConnectOnboardingReturnUrls({
      storeId: 72,
      storeStatus: "active",
      primaryDomain: "atelier.mazigho.ch",
      mode: "test",
    })).toEqual({
      refreshUrl: "https://atelier.mazigho.ch/gestion-boutique?stripe_connect=test_refresh",
      returnUrl: "https://atelier.mazigho.ch/gestion-boutique?stripe_connect=test_return",
    });
  });

  it("uses the private platform panel for a boutique still in setup", () => {
    expect(getStripeConnectOnboardingReturnUrls({
      storeId: 7950009,
      storeStatus: "setup",
      primaryDomain: "recette-paiement.mazigho.ch",
      mode: "test",
    })).toEqual({
      refreshUrl: "https://www.mazigho.ch/gestion-boutique?preparation=7950009&stripe_connect=test_refresh",
      returnUrl: "https://www.mazigho.ch/gestion-boutique?preparation=7950009&stripe_connect=test_return",
    });
  });

  it("rejects an unsafe public domain for an active boutique", () => {
    expect(() => getStripeConnectOnboardingReturnUrls({
      storeId: 72,
      storeStatus: "active",
      primaryDomain: "https://invalid.example/path",
      mode: "test",
    })).toThrow("STORE_DOMAIN_INVALID");
  });
});
