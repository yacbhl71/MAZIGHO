export type StoreOpeningStatus = "setup" | "active" | "limited" | "suspended" | "closed";

export type StoreOpeningReadinessItem = {
  id: string;
  label: string;
  ready: boolean;
};

export type StoreOpeningReadinessState = "action_required" | "ready_for_studio_review" | "opened" | "unavailable";

/**
 * Translates the existing store-scoped readiness controls into one explicit
 * opening milestone. It is intentionally read-only: it cannot change the
 * storefront status, domain, payment configuration or any customer data.
 */
export function buildStoreOpeningReadiness(input: {
  status: StoreOpeningStatus;
  items: readonly StoreOpeningReadinessItem[];
}) {
  const preOpeningItems = input.items.filter(item => item.id !== "public_view");
  const incompleteItems = preOpeningItems.filter(item => !item.ready);
  const publicView = input.items.find(item => item.id === "public_view");
  const localRequirementsComplete = incompleteItems.length === 0 && preOpeningItems.length > 0;
  const publicViewReady = Boolean(publicView?.ready);

  const state: StoreOpeningReadinessState = input.status === "active" && publicViewReady
    ? "opened"
    : input.status === "setup" && localRequirementsComplete
      ? "ready_for_studio_review"
      : input.status === "setup"
        ? "action_required"
        : "unavailable";

  const presentation = {
    action_required: {
      label: "À compléter avant revue Studio",
      detail: `${incompleteItems.length} élément${incompleteItems.length > 1 ? "s" : ""} de préparation reste${incompleteItems.length > 1 ? "nt" : ""} à finaliser avant qu’une revue d’ouverture puisse être demandée.`,
    },
    ready_for_studio_review: {
      label: "Prête pour revue Studio",
      detail: "Les contrôles locaux sont complets. L’ouverture publique reste une décision distincte de MAZIGHO Studio, avec vérification manuelle du domaine.",
    },
    opened: {
      label: "Boutique ouverte",
      detail: "La vitrine est déclarée active. Continuez à surveiller le catalogue, le stock et les informations affichées au client.",
    },
    unavailable: {
      label: "Statut à revoir dans Studio",
      detail: "Cette boutique n’est ni en préparation ni ouverte. Son statut doit être examiné dans MAZIGHO Studio avant toute nouvelle décision d’ouverture.",
    },
  } as const;

  return {
    state,
    ...presentation[state],
    preOpeningCompleted: preOpeningItems.length - incompleteItems.length,
    preOpeningTotal: preOpeningItems.length,
    incompleteItems: incompleteItems.map(item => ({ id: item.id, label: item.label })),
    localRequirementsComplete,
    publicViewReady,
    publicActivationExecuted: input.status === "active" && publicViewReady,
    paymentActivationExecuted: false as const,
  };
}
