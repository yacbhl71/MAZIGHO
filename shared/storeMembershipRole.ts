export const storeMembershipRoles = [
  "owner",
  "manager",
  "catalog_editor",
  "support_agent",
  "order_operator",
  "accountant",
  "viewer",
] as const;

export type StoreMembershipRole = typeof storeMembershipRoles[number];

export type StoreMembershipRolePresentation = {
  label: string;
  detail: string;
};

const presentations: Record<StoreMembershipRole, StoreMembershipRolePresentation> = {
  owner: {
    label: "Propriétaire",
    detail: "Pilote la boutique et désigne les accès délégués depuis les processus prévus.",
  },
  manager: {
    label: "Manager de boutique",
    detail: "Pilote le contenu et les réglages de cette boutique, sans accès à MAZIGHO Studio.",
  },
  catalog_editor: {
    label: "Éditeur catalogue",
    detail: "Prépare uniquement les brouillons de catalogue de cette boutique.",
  },
  support_agent: {
    label: "Support client",
    detail: "Traite les messages et les avis de cette boutique uniquement.",
  },
  order_operator: {
    label: "Opérateur commandes",
    detail: "Suit les commandes opérationnelles de cette boutique, sans paiement ni données sensibles inutiles.",
  },
  accountant: {
    label: "Comptabilité",
    detail: "Rôle réservé aux futurs écrans comptables isolés de cette boutique.",
  },
  viewer: {
    label: "Lecture seule",
    detail: "Rôle réservé aux futures vues de consultation sans modification.",
  },
};

export function getStoreMembershipRolePresentation(role: string | null | undefined): StoreMembershipRolePresentation {
  return presentations[role as StoreMembershipRole] ?? {
    label: "Accès non reconnu",
    detail: "Aucun espace de travail n’est accordé tant que le rôle n’est pas reconnu et actif.",
  };
}

export function isStoreManagementRole(role: string | null | undefined): boolean {
  return role === "owner" || role === "manager";
}

export function getStoreStaffWorkspace(role: string | null | undefined): { href: string; title: string; description: string } | null {
  switch (role) {
    case "catalog_editor":
      return { href: "/admin/catalogue-brouillons", title: "Éditeur catalogue", description: "Préparer des fiches produit en brouillon pour cette boutique." };
    case "support_agent":
      return { href: "/admin/assistance", title: "Service client", description: "Traiter les messages et modérer les avis de cette boutique." };
    case "order_operator":
      return { href: "/admin/operations-commandes", title: "Opérateur commandes", description: "Suivre les commandes déjà acceptées de cette boutique." };
    default:
      return null;
  }
}
