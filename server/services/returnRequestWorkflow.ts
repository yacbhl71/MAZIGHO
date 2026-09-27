export const returnRequestStatuses = [
  "requested",
  "approved",
  "return_received",
  "closed",
  "rejected",
  // Legacy state retained only to display rows created before the controlled
  // workflow. New code never creates this state and never issues a refund.
  "refunded",
] as const;

export type ReturnRequestStatus = (typeof returnRequestStatuses)[number];

export const returnRequestActions = ["approve", "reject", "mark_received", "close"] as const;
export type ReturnRequestAction = (typeof returnRequestActions)[number];

const transitions: Record<Exclude<ReturnRequestStatus, "refunded">, Partial<Record<ReturnRequestAction, ReturnRequestStatus>>> = {
  requested: { approve: "approved", reject: "rejected" },
  approved: { mark_received: "return_received" },
  return_received: { close: "closed" },
  closed: {},
  rejected: {},
};

export function getReturnRequestNextStatus(currentStatus: ReturnRequestStatus, action: ReturnRequestAction): ReturnRequestStatus | null {
  if (currentStatus === "refunded") return null;
  return transitions[currentStatus][action] ?? null;
}

export function getReturnRequestActionLabel(action: ReturnRequestAction) {
  return action === "approve"
    ? "instructions de retour enregistrées"
    : action === "reject"
      ? "demande refusée"
      : action === "mark_received"
        ? "retour réceptionné"
        : "dossier clôturé";
}

export function getReturnRequestStatusLabel(status: ReturnRequestStatus) {
  return status === "requested"
    ? "Retour demandé"
    : status === "approved"
      ? "Instructions envoyées"
      : status === "return_received"
        ? "Retour réceptionné"
        : status === "closed"
          ? "Dossier clôturé"
          : status === "rejected"
            ? "Retour refusé"
            : "Ancien remboursement déclaré";
}
