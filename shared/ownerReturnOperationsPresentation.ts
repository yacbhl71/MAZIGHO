export const ownerReturnQueueFilters = [
  "all",
  "to_decide",
  "awaiting_return",
  "received",
  "completed",
] as const;

export type OwnerReturnQueueFilter = (typeof ownerReturnQueueFilters)[number];

type OwnerReturnOperationSource = {
  id: number;
  status: string;
  externalCaseStatus?: string | null;
  createdAt: Date | string;
};

export type OwnerReturnOperationalPresentation = {
  filter: Exclude<OwnerReturnQueueFilter, "all">;
  label: string;
  description: string;
  priority: number;
};

export const ownerReturnQueueFilterLabels: Record<OwnerReturnQueueFilter, string> = {
  all: "Tous",
  to_decide: "À décider",
  awaiting_return: "En retour",
  received: "Réceptionnés",
  completed: "Terminés",
};

/**
 * Pure presentation contract for the owner after-sales queue. It does not
 * mutate a return, notify a customer, contact a provider or perform a refund.
 */
export function getOwnerReturnOperationalPresentation(input: OwnerReturnOperationSource): OwnerReturnOperationalPresentation {
  if (input.status === "requested") {
    return {
      filter: "to_decide",
      label: "Décision à prendre",
      description: "Examiner le motif et choisir des instructions ou un refus motivé.",
      priority: input.externalCaseStatus === "action_required" ? 0 : 1,
    };
  }
  if (input.status === "return_received") {
    return {
      filter: "received",
      label: "Contrôle puis clôture",
      description: "Le retour est reçu : vérifiez-le avant de clôturer le dossier.",
      priority: input.externalCaseStatus === "action_required" ? 0 : 2,
    };
  }
  if (input.status === "approved") {
    return {
      filter: "awaiting_return",
      label: "En attente du colis",
      description: "Les instructions sont enregistrées. Attendez la réception physique du retour.",
      priority: input.externalCaseStatus === "action_required" ? 0 : 3,
    };
  }
  return {
    filter: "completed",
    label: input.status === "rejected" ? "Demande refusée" : "Dossier terminé",
    description: "Aucune action opérationnelle supplémentaire n’est disponible dans MAZIGHO.",
    priority: 4,
  };
}

export function filterOwnerReturnRequestsForOperationalQueue<T extends OwnerReturnOperationSource>(entries: readonly T[], filter: OwnerReturnQueueFilter): T[] {
  return [...entries]
    .filter(entry => filter === "all" || getOwnerReturnOperationalPresentation(entry).filter === filter)
    .sort((left, right) => {
      const leftPresentation = getOwnerReturnOperationalPresentation(left);
      const rightPresentation = getOwnerReturnOperationalPresentation(right);
      if (leftPresentation.priority !== rightPresentation.priority) return leftPresentation.priority - rightPresentation.priority;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
}
