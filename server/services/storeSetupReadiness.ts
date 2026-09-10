export type StudioDemoBusinessType = "animalier" | "bijoux" | "vetements";

export type StoreSetupReadinessInput = {
  status: "setup" | "active" | "limited" | "suspended" | "closed";
  isGiftProvisioned: boolean;
  businessType: StudioDemoBusinessType | "autre" | null;
  hasActiveOwner: boolean;
  hasOwnDesignProfile: boolean;
  brandName: string;
  hasOwnLegalProfile: boolean;
  categoryCount: number;
  activeProductCount: number;
  hasCurrency: boolean;
};

export type StoreSetupReadinessCheck = {
  key: string;
  label: string;
  state: "ready" | "blocked" | "manual";
  detail: string;
};

const BUSINESS_LABELS: Record<StudioDemoBusinessType, string> = {
  animalier: "animalier",
  bijoux: "bijoux",
  vetements: "vêtements",
};

function isStudioDemoBusinessType(value: StoreSetupReadinessInput["businessType"]): value is StudioDemoBusinessType {
  return value === "animalier" || value === "bijoux" || value === "vetements";
}

/**
 * Read-only private readiness for MAZIGHO Studio.
 *
 * It intentionally does not assess domains, DNS, payment, supplier, delivery,
 * or public publication. Those remain separate and explicitly confirmed steps.
 */
export function buildStoreSetupReadiness(input: StoreSetupReadinessInput) {
  const businessType = input.businessType;
  const supportedBusiness = isStudioDemoBusinessType(businessType);
  const businessLabel = supportedBusiness ? BUSINESS_LABELS[businessType] : "non pris en charge";
  const hasCatalogue = input.categoryCount >= 1 && input.activeProductCount >= 1;

  const checks: StoreSetupReadinessCheck[] = [
    {
      key: "store_status",
      label: "Boutique en préparation",
      state: input.status === "setup" ? "ready" : "blocked",
      detail: input.status === "setup" ? "La boutique demeure isolée du public et peut être préparée dans Studio." : "Cette lecture concerne uniquement une boutique encore en état setup.",
    },
    {
      key: "gift_scope",
      label: "Origine contrôlée",
      state: input.isGiftProvisioned ? "ready" : "blocked",
      detail: input.isGiftProvisioned ? "La boutique est issue du parcours de boutique offerte MAZIGHO Studio." : "La boutique ne provient pas du parcours de préparation contrôlé.",
    },
    {
      key: "business_type",
      label: "Univers de démonstration",
      state: supportedBusiness ? "ready" : "blocked",
      detail: supportedBusiness ? `L’univers ${businessLabel} dispose d’un kit et d’un aperçu privé Studio.` : "Préparez un univers pris en charge avant d’utiliser les kits de démonstration Studio.",
    },
    {
      key: "brand",
      label: "Identité de marque propre",
      state: input.hasOwnDesignProfile && input.brandName.trim().length >= 2 && input.brandName.trim().toLowerCase() !== "mazigho" ? "ready" : "blocked",
      detail: input.hasOwnDesignProfile && input.brandName.trim().length >= 2 && input.brandName.trim().toLowerCase() !== "mazigho" ? "Un profil visuel distinct de MAZIGHO est enregistré." : "Ajoutez une identité de boutique propre avant toute préparation plus avancée.",
    },
    {
      key: "catalogue",
      label: "Base de catalogue présente",
      state: hasCatalogue ? "ready" : "blocked",
      detail: hasCatalogue ? "Au moins une catégorie et une fiche active sont enregistrées dans la boutique isolée." : "Installez un kit de démonstration ou préparez une catégorie et une fiche avant de consulter le rendu catalogue.",
    },
    {
      key: "currency",
      label: "Devise de boutique définie",
      state: input.hasCurrency ? "ready" : "blocked",
      detail: input.hasCurrency ? "La devise de départ est enregistrée dans les réglages de cette boutique." : "Définissez une devise propre à la boutique avant de poursuivre sa préparation.",
    },
    {
      key: "owner",
      label: "Propriétaire actif",
      state: input.hasActiveOwner ? "ready" : "manual",
      detail: input.hasActiveOwner ? "Un propriétaire actif est rattaché à la boutique." : "Préparez ou finalisez l’accès du propriétaire depuis le parcours Studio séparé.",
    },
    {
      key: "legal",
      label: "Informations légales prêtes",
      state: input.hasOwnLegalProfile ? "ready" : "manual",
      detail: input.hasOwnLegalProfile ? "Une fiche légale propre existe dans la boutique, sans détail exposé ici." : "Complétez les informations légales avant toute ouverture publique future.",
    },
    {
      key: "public_opening",
      label: "Ouverture publique",
      state: "manual",
      detail: "Hors de ce suivi privé : aucun domaine, DNS, panier, paiement ou activation n’est évalué ni modifié.",
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
    privatePreviewUsable: input.status === "setup" && input.isGiftProvisioned && supportedBusiness,
    publicStorefront: false as const,
  };
}
