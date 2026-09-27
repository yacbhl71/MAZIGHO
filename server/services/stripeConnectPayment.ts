import type { MazighoSaasPlanId } from "../../shared/mazighoSaasPlans";
import { getMazighoSaasPlan } from "../../shared/mazighoSaasPlans";

export type StripeConnectPaymentReadiness =
  | { enabled: true; accountId: string; commissionRateBps: number; planId: MazighoSaasPlanId }
  | { enabled: false; reason: "platform_test_mode_disabled" | "platform_test_key_missing" | "store_plan_missing" | "store_plan_unsupported" | "connect_account_missing" | "connect_onboarding_incomplete" | "connect_payouts_incomplete" };

export type StripeConnectAccountState = {
  accountId: string | null;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

/**
 * Stripe Connect remains in Test Mode until a dedicated, separately approved
 * live-mode release. A per-store connected account is never accepted from the
 * browser; only a server-side stored account reference can open checkout.
 */
export function getStripeConnectPaymentReadiness(input: {
  environment?: Record<string, string | undefined>;
  planId: unknown;
  account: StripeConnectAccountState | null;
}): StripeConnectPaymentReadiness {
  const environment = input.environment ?? process.env;
  const platformKey = environment.STRIPE_SECRET_KEY?.trim() || "";
  if (!platformKey.startsWith("sk_test_")) return { enabled: false, reason: "platform_test_key_missing" };
  if (environment.MAZIGHO_ENABLE_STRIPE_TEST_CONNECT?.trim() !== "true") return { enabled: false, reason: "platform_test_mode_disabled" };

  const plan = getMazighoSaasPlan(input.planId);
  if (!input.planId) return { enabled: false, reason: "store_plan_missing" };
  if (!plan) return { enabled: false, reason: "store_plan_unsupported" };
  if (!input.account?.accountId) return { enabled: false, reason: "connect_account_missing" };
  if (!input.account.onboardingComplete || !input.account.chargesEnabled || !input.account.detailsSubmitted) {
    return { enabled: false, reason: "connect_onboarding_incomplete" };
  }
  if (!input.account.payoutsEnabled) return { enabled: false, reason: "connect_payouts_incomplete" };

  return {
    enabled: true,
    accountId: input.account.accountId,
    commissionRateBps: plan.commissionRateBps,
    planId: plan.id,
  };
}

/** Stripe fees use minor units; floor avoids charging an extra cent to a store. */
export function calculateMazighoApplicationFee(chargeAmount: number, commissionRateBps: number): number {
  if (!Number.isSafeInteger(chargeAmount) || chargeAmount <= 0) throw new Error("STRIPE_CONNECT_CHARGE_AMOUNT_INVALID");
  if (!Number.isSafeInteger(commissionRateBps) || commissionRateBps < 0 || commissionRateBps > 10_000) {
    throw new Error("STRIPE_CONNECT_COMMISSION_RATE_INVALID");
  }
  return Math.floor((chargeAmount * commissionRateBps) / 10_000);
}

export function describeStripeConnectPaymentBlock(reason: Exclude<StripeConnectPaymentReadiness, { enabled: true }> ["reason"]): string {
  switch (reason) {
    case "platform_test_mode_disabled": return "Le paiement Stripe Connect de test n’est pas activé par MAZIGHO Studio.";
    case "platform_test_key_missing": return "La configuration Stripe Test de la plateforme est indisponible.";
    case "store_plan_missing": return "Aucun plan commercial n’est encore attribué à cette boutique.";
    case "store_plan_unsupported": return "Le plan attribué ne permet pas encore l’encaissement Stripe Connect.";
    case "connect_account_missing": return "Le compte Stripe Connect de cette boutique n’est pas encore créé.";
    case "connect_onboarding_incomplete": return "Le compte Stripe Connect de cette boutique doit terminer sa configuration avant d’encaisser.";
    case "connect_payouts_incomplete": return "Le compte Stripe Connect doit aussi être autorisé à recevoir ses versements avant d’encaisser.";
  }
}
