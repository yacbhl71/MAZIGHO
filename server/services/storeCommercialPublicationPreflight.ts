export type CommercialPreflightState = "ready" | "blocked" | "manual";

export type CommercialPreflightInput = {
  status: "setup" | "active" | "limited" | "suspended" | "closed";
  hasSavedBuilderConfiguration: boolean;
  collectionCount: number;
  hasSavedProducts: boolean;
  productCount: number;
  pricedProductCount: number;
  hasSavedOperations: boolean;
  cartEligibleProductCount: number;
};

export type CommercialPreflightCheck = {
  key: string;
  label: string;
  state: CommercialPreflightState;
  detail: string;
};

/**
 * Reviews only Studio preparation data. It intentionally cannot publish any
 * product, create a public cart, or change the store status.
 */
export function buildStoreCommercialPublicationPreflight(input: CommercialPreflightInput) {
  const checks: CommercialPreflightCheck[] = [
    {
      key: "store_setup",
      label: "Boutique toujours en préparation",
      state: input.status === "setup" ? "ready" : "blocked",
      detail: input.status === "setup" ? "La revue commerciale reste isolée dans Studio." : "Ce prévol est réservé à une boutique encore en état setup.",
    },
    {
      key: "identity",
      label: "Identité enregistrée",
      state: input.hasSavedBuilderConfiguration ? "ready" : "blocked",
      detail: input.hasSavedBuilderConfiguration ? "La marque, la niche et la structure ont été enregistrées dans le créateur privé." : "Enregistrez d’abord l’identité et la structure de la boutique.",
    },
    {
      key: "collections",
      label: "Collections préparées",
      state: input.collectionCount > 0 ? "ready" : "blocked",
      detail: input.collectionCount > 0 ? `${input.collectionCount} collection${input.collectionCount > 1 ? "s" : ""} de préparation sont disponibles.` : "Préparez au moins une collection privée.",
    },
    {
      key: "products",
      label: "Fiches et prix préparés",
      state: input.hasSavedProducts && input.productCount > 0 && input.pricedProductCount > 0 ? "ready" : "blocked",
      detail: input.hasSavedProducts && input.productCount > 0 && input.pricedProductCount > 0 ? `${input.pricedProductCount} fiche${input.pricedProductCount > 1 ? "s" : ""} avec prix de préparation est disponible.` : "Préparez et enregistrez au moins une fiche produit avec un prix de présentation.",
    },
    {
      key: "operations",
      label: "Disponibilités préparées",
      state: input.hasSavedOperations && input.cartEligibleProductCount > 0 ? "ready" : "blocked",
      detail: input.hasSavedOperations && input.cartEligibleProductCount > 0 ? `${input.cartEligibleProductCount} fiche${input.cartEligibleProductCount > 1 ? "s" : ""} peut ou peuvent être testées dans le panier privé.` : "Renseignez au moins une disponibilité préparatoire avant de tester le panier.",
    },
    {
      key: "private_cart",
      label: "Simulation de panier réalisable",
      state: input.cartEligibleProductCount > 0 ? "ready" : "blocked",
      detail: input.cartEligibleProductCount > 0 ? "Le panier privé peut vérifier quantités et total de présentation." : "Aucune fiche disponible ne peut encore être simulée.",
    },
    {
      key: "catalogue_publication",
      label: "Revue manuelle de publication catalogue",
      state: "manual",
      detail: "La copie vers le catalogue public n’est pas exécutée ici. Elle exigera une revue explicite des fiches, visuels, variantes, livraison, règles de stock et qualité commerciale.",
    },
    {
      key: "public_activation",
      label: "Ouverture publique distincte",
      state: "manual",
      detail: "Le storefront, le panier réel, le checkout et les paiements restent fermés jusqu’au prévol d’activation public et à sa confirmation manuelle distincte.",
    },
  ];

  const readyCount = checks.filter(check => check.state === "ready").length;
  const blockedCount = checks.filter(check => check.state === "blocked").length;
  const manualCount = checks.filter(check => check.state === "manual").length;

  return {
    checks,
    readyCount,
    blockedCount,
    manualCount,
    locallyReadyForManualCommercialReview: blockedCount === 0,
    cataloguePublicationExecuted: false as const,
    publicCartExecuted: false as const,
    publicActivationExecuted: false as const,
  };
}
