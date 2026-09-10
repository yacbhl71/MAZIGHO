import type { StoreSetupReadinessCheck } from "./storeSetupReadiness";

export type StudioPreparationChecklistItem = {
  key: "identity" | "collections" | "pages" | "media" | "catalogue" | "domain" | "private_preview" | "public_opening";
  label: string;
  state: "ready" | "action" | "optional" | "manual";
  detail: string;
  action: "builder" | "collections" | "pages" | "storefront_preview" | "studio" | null;
};

export type StorePreparationChecklistInput = {
  status: "setup" | "active" | "limited" | "suspended" | "closed";
  primaryDomain: string;
  readinessChecks: StoreSetupReadinessCheck[];
  hasSavedBuilderConfiguration: boolean;
  hasSavedCollections: boolean;
  collectionCount: number;
  hasSavedPageDrafts: boolean;
  enabledPageCount: number;
  pagesWithCoverImageCount: number;
};

function hasReadyCheck(checks: StoreSetupReadinessCheck[], key: string) {
  return checks.some(check => check.key === key && check.state === "ready");
}

function isPreparedPublicDomain(domain: string) {
  const value = domain.trim().toLowerCase();
  return Boolean(value) && !value.endsWith(".local") && value.includes(".");
}

/**
 * Studio-only progress signal. It deliberately does not verify DNS, certificates,
 * payments, stock, suppliers or public activation. Those are separate controls.
 */
export function buildStorePreparationChecklist(input: StorePreparationChecklistInput) {
  const identityReady = input.hasSavedBuilderConfiguration && hasReadyCheck(input.readinessChecks, "brand");
  const catalogueReady = hasReadyCheck(input.readinessChecks, "catalogue");
  const domainPrepared = isPreparedPublicDomain(input.primaryDomain);
  const pagesReady = input.hasSavedPageDrafts && input.enabledPageCount > 0;
  const collectionsReady = input.hasSavedCollections && input.collectionCount > 0;

  const items: StudioPreparationChecklistItem[] = [
    {
      key: "identity",
      label: "Identité de marque",
      state: identityReady ? "ready" : "action",
      detail: identityReady
        ? "Une identité propre est enregistrée pour cette boutique."
        : "Préparez puis enregistrez le nom, le message, l’univers et le style de la boutique.",
      action: "builder",
    },
    {
      key: "collections",
      label: "Collections de présentation",
      state: collectionsReady ? "ready" : "action",
      detail: collectionsReady
        ? `${input.collectionCount} collection${input.collectionCount > 1 ? "s" : ""} est/sont préparée${input.collectionCount > 1 ? "s" : ""} dans un brouillon privé, sans catégorie ni produit réel.`
        : "Préparez les univers et accroches qui organiseront la future sélection de la boutique.",
      action: "collections",
    },
    {
      key: "pages",
      label: "Pages de présentation",
      state: pagesReady ? "ready" : "action",
      detail: pagesReady
        ? `${input.enabledPageCount} page${input.enabledPageCount > 1 ? "s" : ""} éditoriale${input.enabledPageCount > 1 ? "s" : ""} est/sont préparée${input.enabledPageCount > 1 ? "s" : ""} en brouillon privé.`
        : "Préparez au moins une page : À propos, Questions fréquentes, Contact ou Inspiration.",
      action: "pages",
    },
    {
      key: "media",
      label: "Médias de page",
      state: input.pagesWithCoverImageCount > 0 ? "ready" : "optional",
      detail: input.pagesWithCoverImageCount > 0
        ? `${input.pagesWithCoverImageCount} image${input.pagesWithCoverImageCount > 1 ? "s" : ""} de couverture est/sont attachée${input.pagesWithCoverImageCount > 1 ? "s" : ""} à des brouillons privés.`
        : "Optionnel : ajoutez une image de couverture lorsqu’elle renforce la page, sans utiliser d’image sensible.",
      action: "pages",
    },
    {
      key: "catalogue",
      label: "Catalogue de démonstration",
      state: catalogueReady ? "ready" : "action",
      detail: catalogueReady
        ? "La boutique contient une base de catégories et de fiches isolées."
        : "Installez ou préparez un kit de démonstration depuis MAZIGHO Studio.",
      action: "studio",
    },
    {
      key: "domain",
      label: "Domaine de boutique",
      state: domainPrepared ? "ready" : "action",
      detail: domainPrepared
        ? "Un domaine de boutique est renseigné dans le registre privé. Sa vérification technique et l’ouverture restent séparées."
        : "Renseignez un domaine dédié quand vous serez prêt à le préparer, sans ouvrir la boutique au public.",
      action: "studio",
    },
    {
      key: "private_preview",
      label: "Aperçu privé",
      state: input.status === "setup" ? "ready" : "manual",
      detail: input.status === "setup"
        ? "Le rendu de la boutique est consultable dans Studio, sans exposition publique."
        : "Cet aperçu de préparation est prévu pour une boutique encore en setup.",
      action: "storefront_preview",
    },
    {
      key: "public_opening",
      label: "Ouverture publique",
      state: "manual",
      detail: "Toujours séparée : aucune action de cette checklist ne vérifie DNS, certificat, paiement, panier ou activation.",
      action: null,
    },
  ];

  const essentialItems = items.filter(item => ["identity", "collections", "pages", "catalogue", "domain"].includes(item.key));
  const readyEssentialCount = essentialItems.filter(item => item.state === "ready").length;

  return {
    items,
    readyEssentialCount,
    essentialCount: essentialItems.length,
    privateChecklist: true as const,
    publicStorefront: false as const,
  };
}
