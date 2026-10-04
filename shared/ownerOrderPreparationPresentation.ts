export type OwnerOrderActionRow = {
  id: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  totalAmount: number;
  currencyCode?: string | null;
  createdAt: string | Date;
  trackingNumber?: string | null;
};

export const ownerOrderStatusLabels: Record<string, string> = {
  pending: "En attente",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export const ownerPaymentStatusLabels: Record<string, string> = {
  unpaid: "Non réglé",
  paid: "Réglé",
  pending: "En attente",
  failed: "Échec",
  refunded: "Remboursé",
};

export function isOwnerOrderReadyForPreparation(order: Pick<OwnerOrderActionRow, "paymentStatus" | "paymentMethod">) {
  return order.paymentStatus === "paid" || order.paymentMethod === "cash_on_delivery_dz";
}

export function getOwnerOrderPaymentLabel(order: Pick<OwnerOrderActionRow, "paymentStatus" | "paymentMethod">) {
  if (order.paymentMethod === "cash_on_delivery_dz") {
    return order.paymentStatus === "paid" ? "Livraison · encaissé" : "À encaisser à la livraison";
  }
  return ownerPaymentStatusLabels[order.paymentStatus] || order.paymentStatus;
}

export type OwnerOrderNextAction = {
  title: string;
  description: string;
  tone: "ready" | "warning" | "neutral";
};

/**
 * Presentation-only helper: mutations remain store-scoped and guarded by the
 * server. It makes the next manual step explicit on touch-first order cards.
 */
export function getOwnerOrderNextAction(order: Pick<OwnerOrderActionRow, "status" | "paymentStatus" | "paymentMethod">): OwnerOrderNextAction {
  const readyForPreparation = isOwnerOrderReadyForPreparation(order);

  if (order.status === "pending" && readyForPreparation) {
    return {
      title: "Décision à confirmer",
      description: order.paymentMethod === "cash_on_delivery_dz"
        ? "Acceptez la commande pour lancer la préparation et l’encaissement à la livraison."
        : "Acceptez ou refusez la commande avant toute préparation manuelle.",
      tone: "ready",
    };
  }

  if (order.status === "pending") {
    return {
      title: "Paiement à confirmer",
      description: "Aucune préparation ni coordonnée de livraison n’est disponible tant que le paiement n’est pas confirmé.",
      tone: "warning",
    };
  }

  if (order.status === "processing") {
    return {
      title: "Préparer puis expédier",
      description: "Consultez les articles, préparez le bon si nécessaire, puis enregistrez le suivi au moment de l’expédition.",
      tone: "ready",
    };
  }

  if (order.status === "shipped") {
    return {
      title: "Livraison à confirmer",
      description: "Marquez la commande comme livrée uniquement après confirmation de la remise au client ou par le transporteur.",
      tone: "ready",
    };
  }

  if (order.status === "delivered" && order.paymentMethod === "cash_on_delivery_dz" && order.paymentStatus !== "paid") {
    return {
      title: "Encaissement COD à confirmer",
      description: "La livraison est enregistrée. Confirmez maintenant l’encaissement manuel à la livraison.",
      tone: "ready",
    };
  }

  if (order.status === "delivered") {
    return {
      title: "Commande terminée",
      description: "La livraison est enregistrée. Les demandes de retour éventuelles restent traitées séparément.",
      tone: "neutral",
    };
  }

  if (order.status === "cancelled") {
    return { title: "Commande annulée", description: "Aucune nouvelle action opérationnelle n’est disponible pour cette commande.", tone: "neutral" };
  }

  if (order.status === "refunded") {
    return { title: "Commande remboursée", description: "Le dossier après-vente est clôturé pour cette commande.", tone: "neutral" };
  }

  return { title: "Étape à vérifier", description: "Consultez l’historique de la commande avant toute action manuelle.", tone: "warning" };
}
