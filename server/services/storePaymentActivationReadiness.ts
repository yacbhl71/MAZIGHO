import type { MazighoSaasPlanId } from "../../shared/mazighoSaasPlans";

type StripeSetupSnapshot = {
  schemaReady: boolean;
  plan: { id: MazighoSaasPlanId; name: string; commissionRateBps: number } | null;
  account: {
    accountId: string;
    onboardingComplete: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  } | null;
  paymentReadiness: { enabled: true } | { enabled: false; reason: string };
};

export type StorePaymentActivationCheck = {
  id: "storefront" | "plan" | "stripe_schema" | "seller_account" | "seller_capabilities" | "test_environment";
  label: string;
  state: "ready" | "attention" | "pending";
  detail: string;
};

export type StorePaymentActivationReadiness = {
  stage:
    | "storefront_setup_required"
    | "plan_required"
    | "stripe_schema_required"
    | "seller_account_required"
    | "seller_capabilities_required"
    | "test_environment_required"
    | "test_checkout_ready";
  label: string;
  detail: string;
  testCheckoutReady: boolean;
  liveReviewReady: false;
  liveActivationExecuted: false;
  checks: StorePaymentActivationCheck[];
};

/**
 * Converts tenant-scoped Stripe Connect state into an explicit, read-only
 * preparation path. It never creates an account, opens a payment flow or
 * changes a store lifecycle. A completed Test setup is evidence only that a
 * controlled test checkout can be attempted; it is not a Live authorization.
 */
export function buildStorePaymentActivationReadiness(input: {
  storefrontPrepared: boolean;
  stripe: StripeSetupSnapshot;
}): StorePaymentActivationReadiness {
  const account = input.stripe.account;
  const sellerCapabilitiesReady = Boolean(
    account?.onboardingComplete
      && account.detailsSubmitted
      && account.chargesEnabled
      && account.payoutsEnabled,
  );
  const testEnvironmentReady = input.stripe.paymentReadiness.enabled;

  const checks: StorePaymentActivationCheck[] = [
    {
      id: "storefront",
      label: "Préparation de la boutique",
      state: input.storefrontPrepared ? "ready" : "attention",
      detail: input.storefrontPrepared
        ? "Les contrôles locaux de catalogue, livraison, informations publiques et marchés sont renseignés."
        : "Terminez les contrôles d’ouverture de la boutique avant de préparer l’encaissement.",
    },
    {
      id: "plan",
      label: "Offre commerciale",
      state: input.stripe.plan ? "ready" : "attention",
      detail: input.stripe.plan
        ? `${input.stripe.plan.name} est attribué ; sa commission MAZIGHO est calculée côté serveur.`
        : "MAZIGHO Studio doit attribuer BASIC, PRO ou LIFETIME avant la connexion du vendeur.",
    },
    {
      id: "stripe_schema",
      label: "Structure Stripe Connect",
      state: input.stripe.schemaReady ? "ready" : "pending",
      detail: input.stripe.schemaReady
        ? "La structure isolée par boutique est disponible."
        : "La migration Stripe Connect doit être appliquée par le déploiement avant toute configuration.",
    },
    {
      id: "seller_account",
      label: "Compte vendeur Stripe",
      state: account ? "ready" : "attention",
      detail: account
        ? "Le compte vendeur est relié uniquement à cette boutique."
        : "Le propriétaire peut démarrer l’onboarding Stripe depuis les intégrations, une fois l’offre attribuée.",
    },
    {
      id: "seller_capabilities",
      label: "Capacités vendeur",
      state: !account ? "pending" : sellerCapabilitiesReady ? "ready" : "attention",
      detail: !account
        ? "Cette étape dépend d’abord de la création du compte vendeur."
        : sellerCapabilitiesReady
          ? "Informations, encaissements et versements sont validés par Stripe pour l’environnement de préparation."
          : "Le propriétaire doit terminer les informations demandées par Stripe et actualiser le statut.",
    },
    {
      id: "test_environment",
      label: "Validation du checkout",
      state: !sellerCapabilitiesReady ? "pending" : testEnvironmentReady ? "ready" : "attention",
      detail: !sellerCapabilitiesReady
        ? "Cette étape s’ouvre après la validation des capacités du compte vendeur."
        : testEnvironmentReady
          ? "Un checkout Direct Charges peut être vérifié avec des cartes Stripe de préparation, sans débit réel."
          : "MAZIGHO Studio doit terminer la configuration Stripe de préparation avant l’essai du checkout.",
    },
  ];

  const result = (stage: StorePaymentActivationReadiness["stage"], label: string, detail: string): StorePaymentActivationReadiness => ({
    stage,
    label,
    detail,
    testCheckoutReady: stage === "test_checkout_ready",
    liveReviewReady: false,
    liveActivationExecuted: false,
    checks,
  });

  if (!input.storefrontPrepared) {
    return result("storefront_setup_required", "Préparation boutique à compléter", "Finalisez d’abord les prérequis de la boutique ; ils servent aussi de base à une future revue commerciale.");
  }
  if (!input.stripe.plan) {
    return result("plan_required", "Offre commerciale à attribuer", "MAZIGHO Studio doit attribuer BASIC, PRO ou LIFETIME afin de définir la commission applicable.");
  }
  if (!input.stripe.schemaReady) {
    return result("stripe_schema_required", "Déploiement Stripe Connect requis", "La structure sécurisée Stripe Connect doit être disponible avant toute création de compte vendeur.");
  }
  if (!account) {
    return result("seller_account_required", "Compte vendeur à créer", "Le propriétaire peut commencer l’onboarding Stripe depuis les intégrations de sa boutique.");
  }
  if (!sellerCapabilitiesReady) {
    return result("seller_capabilities_required", "Informations vendeur à finaliser", "Stripe doit confirmer les informations, la capacité d’encaissement et les versements du compte vendeur.");
  }
  if (!testEnvironmentReady) {
    return result("test_environment_required", "Validation du checkout à préparer", "Le compte vendeur est prêt ; MAZIGHO Studio doit terminer la configuration Stripe de préparation avant les essais.");
  }
  return result("test_checkout_ready", "Prête pour un essai de checkout", "La boutique peut effectuer une validation Stripe Connect de préparation. Documentez l’essai avant toute revue finale de passage aux paiements réels.");
}
