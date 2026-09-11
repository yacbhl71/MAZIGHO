import { mayServeStorefront, type StorefrontStatus } from "./storeScope";

export type SetupIsolationReviewInput = {
  status: StorefrontStatus;
};

export function buildStoreSetupIsolationReview(input: SetupIsolationReviewInput) {
  const storefrontMayBeServed = mayServeStorefront(input.status);
  const protectedSetup = input.status === "setup" && !storefrontMayBeServed;

  return {
    status: input.status,
    protectedSetup,
    publicStorefrontServed: storefrontMayBeServed,
    publicCartAvailable: false as const,
    publicCheckoutAvailable: false as const,
    cataloguePublicationExecuted: false as const,
    manualChecks: [
      {
        key: "anonymous_domain",
        label: "Vérifier le domaine hors session",
        detail: "Ouvrir le domaine de la boutique dans une session privée et confirmer que l’écran neutre de préparation s’affiche, sans catalogue ni lien d’administration.",
      },
      {
        key: "public_purchase_path",
        label: "Vérifier le parcours d’achat public",
        detail: "Confirmer l’absence de panier, checkout et paiement public tant que la boutique reste en setup.",
      },
      {
        key: "studio_boundary",
        label: "Conserver Studio côté plateforme",
        detail: "Les écrans de préparation restent réservés à MAZIGHO Studio ; une boutique cliente ne doit pas y accéder.",
      },
    ],
  };
}
