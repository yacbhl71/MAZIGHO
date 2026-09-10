export type ActivationCheckState = "ready" | "blocked" | "manual";

export type StoreActivationPreflightInput = {
  status: "setup" | "active" | "limited" | "suspended" | "closed";
  isGiftProvisioned: boolean;
  businessType: "animalier" | "bijoux" | "vetements" | "autre" | null;
  primaryDomain: string;
  hasActiveOwner: boolean;
  hasOwnDesignProfile: boolean;
  brandName: string;
  hasOwnLegalProfile: boolean;
  categoryCount: number;
  activeProductCount: number;
  hasCurrency: boolean;
};

export type StoreActivationCheck = {
  key: string;
  label: string;
  state: ActivationCheckState;
  detail: string;
};

function isPublicDomainFormat(value: string) {
  const domain = value.trim().toLowerCase();
  if (!domain || domain.endsWith(".local") || domain.endsWith(".test")) return false;
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain);
}

export function buildStoreActivationPreflight(input: StoreActivationPreflightInput) {
  const checks: StoreActivationCheck[] = [
    {
      key: "store_status",
      label: "Boutique en préparation",
      state: input.status === "setup" ? "ready" : "blocked",
      detail: input.status === "setup" ? "La boutique est encore isolée du public et peut être revue." : "Seule une boutique en état setup peut passer par ce prévol d’activation.",
    },
    {
      key: "gift_scope",
      label: "Origine boutique offerte",
      state: input.isGiftProvisioned ? "ready" : "blocked",
      detail: input.isGiftProvisioned ? "Le parcours est relié à une boutique offerte créée depuis MAZIGHO Studio." : "Cette boutique ne provient pas du parcours cadeau contrôlé.",
    },
    {
      key: "animalier_scope",
      label: "Univers animalier confirmé",
      state: input.businessType === "animalier" ? "ready" : "blocked",
      detail: input.businessType === "animalier" ? "La boutique suit l’univers animalier retenu pour ce premier parcours." : "Le brouillon source n’est pas identifié comme boutique animalière.",
    },
    {
      key: "owner",
      label: "Propriétaire actif",
      state: input.hasActiveOwner ? "ready" : "blocked",
      detail: input.hasActiveOwner ? "Un propriétaire avec compte actif est rattaché à la boutique." : "Le bénéficiaire doit d’abord activer son compte et être rattaché comme propriétaire.",
    },
    {
      key: "domain_format",
      label: "Domaine public renseigné",
      state: isPublicDomainFormat(input.primaryDomain) ? "ready" : "blocked",
      detail: isPublicDomainFormat(input.primaryDomain) ? "Le format du domaine est compatible avec une mise en ligne." : "Renseignez un domaine public valide ; les valeurs .local et .test ne peuvent pas être activées.",
    },
    {
      key: "domain_manual",
      label: "Domaine vérifié et raccordé",
      state: "manual",
      detail: "À confirmer manuellement avant activation : DNS, domaine Vercel et accès effectif ne sont jamais vérifiés automatiquement par ce prévol.",
    },
    {
      key: "brand",
      label: "Identité de marque propre",
      state: input.hasOwnDesignProfile && input.brandName.trim().length >= 2 && input.brandName.trim().toLowerCase() !== "mazigho" ? "ready" : "blocked",
      detail: input.hasOwnDesignProfile && input.brandName.trim().length >= 2 && input.brandName.trim().toLowerCase() !== "mazigho" ? "Un profil visuel propre à la boutique est enregistré." : "Personnalisez le nom et le profil visuel afin de ne jamais publier l’identité MAZIGHO par défaut.",
    },
    {
      key: "legal",
      label: "Informations légales propres",
      state: input.hasOwnLegalProfile ? "ready" : "blocked",
      detail: input.hasOwnLegalProfile ? "Une fiche légale dédiée est enregistrée pour cette boutique." : "Les informations légales doivent être renseignées avant l’ouverture publique.",
    },
    {
      key: "catalogue",
      label: "Catalogue animalier prêt",
      state: input.categoryCount >= 1 && input.activeProductCount >= 1 ? "ready" : "blocked",
      detail: input.categoryCount >= 1 && input.activeProductCount >= 1 ? "Au moins une catégorie et un produit actif sont disponibles ; vérifiez manuellement leur pertinence animale et leur qualité." : "Ajoutez au moins une catégorie et un produit actif avant l’ouverture.",
    },
    {
      key: "currency",
      label: "Devise de boutique définie",
      state: input.hasCurrency ? "ready" : "blocked",
      detail: input.hasCurrency ? "La devise de départ est enregistrée dans les réglages de la boutique." : "Définissez la devise de départ avant l’ouverture.",
    },
    {
      key: "operator_confirmation",
      label: "Confirmation finale opérateur",
      state: "manual",
      detail: "Le passage vers active restera une action distincte, volontaire et explicitement confirmée par l’opérateur MAZIGHO Studio.",
    },
  ];

  const blockedCount = checks.filter(check => check.state === "blocked").length;
  const readyCount = checks.filter(check => check.state === "ready").length;
  const manualCount = checks.filter(check => check.state === "manual").length;

  return {
    checks,
    readyCount,
    blockedCount,
    manualCount,
    locallyReadyForManualActivation: blockedCount === 0,
    publicActivationExecuted: false as const,
  };
}
