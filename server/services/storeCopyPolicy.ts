export const studioStoreCopyScopes = [
  "storefrontStyle",
  "navigation",
  "collections",
  "pages",
  "categories",
  "products",
  "productMedia",
  "variants",
] as const;

export type StudioStoreCopyScope = typeof studioStoreCopyScopes[number];
export type StudioStoreCopySelectionInput = Partial<Record<StudioStoreCopyScope, boolean>>;
export type StudioStoreCopySelection = Record<StudioStoreCopyScope, boolean>;

const sourceStatuses = new Set(["setup", "active", "limited"]);

/**
 * Normalizes the explicit Studio copy choices. Product media and variants never
 * travel by themselves: both require products, and products require the
 * category structure needed to keep the new tenant internally coherent.
 */
export function normalizeStudioStoreCopySelection(input: StudioStoreCopySelectionInput | null | undefined): StudioStoreCopySelection {
  const selection = Object.fromEntries(studioStoreCopyScopes.map(scope => [scope, input?.[scope] === true])) as StudioStoreCopySelection;
  if (selection.productMedia || selection.variants) selection.products = true;
  if (selection.products) selection.categories = true;
  return selection;
}

export function selectedStudioStoreCopyScopes(selection: StudioStoreCopySelection): StudioStoreCopyScope[] {
  return studioStoreCopyScopes.filter(scope => selection[scope]);
}

export function hasStudioStoreCopyScope(selection: StudioStoreCopySelection) {
  return selectedStudioStoreCopyScopes(selection).length > 0;
}

/** A source is never the MAZIGHO platform and must still be operationally readable. */
export function assertStudioStoreCopySource(input: { isPlatformStore: boolean | number; status: string }) {
  if (Boolean(input.isPlatformStore)) throw new Error("STORE_COPY_PLATFORM_SOURCE_FORBIDDEN");
  if (!sourceStatuses.has(input.status)) throw new Error("STORE_COPY_SOURCE_NOT_ELIGIBLE");
}

/** A copy always writes to a newly created, isolated setup tenant. */
export function assertStudioStoreCopyDestination(input: { sourceStoreId: number; destinationStoreId: number; status: string; isPlatformStore: boolean | number }) {
  if (input.sourceStoreId === input.destinationStoreId) throw new Error("STORE_COPY_SOURCE_DESTINATION_MATCH");
  if (Boolean(input.isPlatformStore) || input.status !== "setup") throw new Error("STORE_COPY_DESTINATION_NOT_ISOLATED_SETUP");
}

export const studioStoreCopyScopeLabels: Record<StudioStoreCopyScope, { label: string; detail: string }> = {
  storefrontStyle: {
    label: "Style storefront",
    detail: "Palette, typographies, disposition et ordre des sections ; jamais logo, identité, textes, bannières ni liens externes.",
  },
  navigation: {
    label: "Navigation",
    detail: "Libellés et liens internes du menu ; les destinations externes sont exclues.",
  },
  collections: {
    label: "Collections privées",
    detail: "Plans de collections du créateur, sans publication automatique.",
  },
  pages: {
    label: "Pages privées",
    detail: "Brouillons de pages et leur structure, à contrôler dans la destination.",
  },
  categories: {
    label: "Catégories",
    detail: "Structure de catégories et contenus associés ; les visuels demandent l’option médias.",
  },
  products: {
    label: "Produits",
    detail: "Fiches, prix, stock, descriptions et options ; jamais fournisseur, lien fournisseur ou coûts fournisseur.",
  },
  productMedia: {
    label: "Images catalogue",
    detail: "Références de visuels publics associées aux catégories et produits sélectionnés ; aucun octet n’est dupliqué en base.",
  },
  variants: {
    label: "Variantes",
    detail: "Libellés, SKU, ajustements de prix et stock par variante ; jamais mappings fournisseur.",
  },
};

export const studioStoreCopyNeverCopied = [
  "utilisateurs, memberships et comptes propriétaires",
  "clients, adresses, PII, paniers, favoris et avis privés",
  "commandes, retours, remboursements, paiements, Stripe et Lemon Squeezy",
  "domaines, DNS, e-mails, invitations, mots de passe, clés et secrets",
  "fournisseurs, dropshipping, coûts, liens et mappings fournisseur",
  "plans SaaS, commissions, dérogations, facturation et quotas",
  "profil légal, livraison, retours, fiscalité, marchés et méthodes de paiement",
  "documents privés, conversations IA, audit, statistiques et réglages internes",
] as const;
