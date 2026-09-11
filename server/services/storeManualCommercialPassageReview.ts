export type ManualCommercialPassageReviewInput = {
  commercialPreparationReady: boolean;
  commercialBlockedCount: number;
  setupIsolated: boolean;
};

export type ManualCommercialPassageState = "ready" | "blocked" | "manual";

export type ManualCommercialPassageCheck = {
  key: string;
  label: string;
  state: ManualCommercialPassageState;
  detail: string;
};

/**
 * Consolidates private preparation signals into a human review list. This is
 * intentionally advisory: it cannot copy drafts, publish a catalogue, open a
 * purchase path, or change the store lifecycle.
 */
export function buildStoreManualCommercialPassageReview(input: ManualCommercialPassageReviewInput) {
  const checks: ManualCommercialPassageCheck[] = [
    {
      key: "private_preparation",
      label: "Brouillons Studio préparés",
      state: input.commercialPreparationReady ? "ready" : "blocked",
      detail: input.commercialPreparationReady ? "Les indicateurs privés de structure, collections, fiches, prix, disponibilités et panier simulé ne signalent plus de blocage." : `${input.commercialBlockedCount} point${input.commercialBlockedCount > 1 ? "s" : ""} de préparation reste ou restent à compléter dans Studio.`,
    },
    {
      key: "setup_isolation",
      label: "Étanchéité de la boutique en setup",
      state: input.setupIsolated ? "ready" : "blocked",
      detail: input.setupIsolated ? "La revue d’étanchéité confirme que l’état setup reste le cadre privé attendu pour cette vérification." : "La boutique n’est pas dans le cadre setup requis pour cette revue manuelle.",
    },
    {
      key: "visuals_variants",
      label: "Visuels et variantes",
      state: "manual",
      detail: "Vérifier manuellement que chaque fiche destinée à une publication future possède les images, variantes, options et textes nécessaires. Aucun visuel ni variante n’est copié ici.",
    },
    {
      key: "delivery_stock_returns",
      label: "Livraison, stock et retours",
      state: "manual",
      detail: "Revoir les règles réellement applicables de livraison, disponibilité, retours et traitement opérationnel. Les références de préparation ne constituent pas une intégration fournisseur.",
    },
    {
      key: "legal_domain",
      label: "Informations légales et domaine",
      state: "manual",
      detail: "Vérifier les informations légales de la boutique et confirmer séparément le domaine avant toute ouverture publique.",
    },
    {
      key: "explicit_decision",
      label: "Décision explicite de publication",
      state: "manual",
      detail: "Après cette revue seulement, une décision distincte devra autoriser ou refuser une future publication de catalogue. Cette page ne prend aucune décision à votre place.",
    },
  ];

  const blockedCount = checks.filter(check => check.state === "blocked").length;
  const manualCount = checks.filter(check => check.state === "manual").length;

  return {
    checks,
    blockedCount,
    manualCount,
    mayRequestManualPublicationReview: blockedCount === 0,
    cataloguePublicationExecuted: false as const,
    publicCartExecuted: false as const,
    publicActivationExecuted: false as const,
  };
}
