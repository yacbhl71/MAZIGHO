export type OwnerStoreStatus = "setup" | "active" | "limited" | "suspended" | "closed";

export type OwnerStoreStatusPresentation = {
  label: string;
  detail: string;
  tone: "teal" | "emerald" | "amber" | "rose" | "slate";
};

const presentations: Record<OwnerStoreStatus, OwnerStoreStatusPresentation> = {
  setup: {
    label: "En préparation",
    detail: "La boutique est encore en préparation. Complétez les éléments de vitrine avant toute ouverture publique.",
    tone: "amber",
  },
  active: {
    label: "Boutique active",
    detail: "La boutique est active. Gérez son contenu et ses réglages depuis cet espace isolé.",
    tone: "emerald",
  },
  limited: {
    label: "Accès limité",
    detail: "La boutique reste isolée, mais son accès ou certaines fonctions sont actuellement limités par MAZIGHO Studio.",
    tone: "amber",
  },
  suspended: {
    label: "Boutique suspendue",
    detail: "La boutique n’est pas disponible au public. Contactez MAZIGHO Studio pour toute régularisation.",
    tone: "rose",
  },
  closed: {
    label: "Boutique fermée",
    detail: "La boutique est fermée. Son contenu reste séparé et aucune ouverture ne peut être déclenchée depuis ce panneau.",
    tone: "slate",
  },
};

export function getOwnerStoreStatusPresentation(status: string | null | undefined): OwnerStoreStatusPresentation {
  return presentations[status as OwnerStoreStatus] ?? presentations.setup;
}
