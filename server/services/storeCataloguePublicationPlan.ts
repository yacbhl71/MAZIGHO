import type { StudioCollectionDraft } from "./storeCollectionDraft";
import type { StudioProductOperationDraft } from "./storeProductOperationsDraft";
import type { StudioProductDraft } from "./storeProductDraft";
import type { StorefrontStatus } from "./storeScope";

export type CataloguePublicationPlanInput = {
  status: StorefrontStatus;
  privatePreparationReady: boolean;
  existingCategoryCount: number;
  existingProductCount: number;
  collections: StudioCollectionDraft[];
  products: StudioProductDraft[];
  operations: StudioProductOperationDraft[];
};

function toSlug(value: string, fallback: string) {
  const slug = value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || fallback;
}

function uniqueSlug(value: string, used: Set<string>, fallback: string) {
  const base = toSlug(value, fallback);
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${base.slice(0, Math.max(1, 70 - String(suffix).length))}-${suffix}`;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
}

/**
 * Converts the deliberately limited Studio drafts into an explicit publication
 * plan. It carries no supplier data and makes the absence of images/options a
 * manual acknowledgement, never an implicit claim of completeness.
 */
export function buildStoreCataloguePublicationPlan(input: CataloguePublicationPlanInput) {
  const categorySlugs = new Set<string>();
  const categories = input.collections.map((collection, index) => ({
    sourceId: collection.id,
    title: collection.title,
    description: collection.description,
    slug: uniqueSlug(collection.title, categorySlugs, `collection-${index + 1}`),
    displayOrder: index + 1,
  }));
  const categoryBySourceId = new Map(categories.map(category => [category.sourceId, category]));
  const operationByProductId = new Map(input.operations.map(operation => [operation.productId, operation]));
  const productSlugs = new Set<string>();
  const products = input.products.flatMap((product, index) => {
    const category = categoryBySourceId.get(product.collectionId);
    if (!category) return [];
    const operation = operationByProductId.get(product.id);
    const stock = operation?.stockState === "in_stock" || operation?.stockState === "limited" ? operation.stockQuantity : 0;
    return [{
      sourceId: product.id,
      categorySourceId: category.sourceId,
      categoryTitle: category.title,
      name: product.name,
      description: product.description,
      slug: uniqueSlug(product.name, productSlugs, `produit-${index + 1}`),
      priceCents: product.priceCents,
      stock,
      featured: product.featured,
      imagesIncluded: false as const,
      variantsIncluded: false as const,
    }];
  });

  const hasExistingCatalogue = input.existingCategoryCount > 0 || input.existingProductCount > 0;
  const blockers = [
    ...(input.status === "setup" ? [] : ["La boutique doit rester en état setup pendant la publication de catalogue."]),
    ...(input.privatePreparationReady ? [] : ["Les brouillons Studio ne sont pas encore prêts pour une revue manuelle."]),
    ...(categories.length > 0 && products.length > 0 ? [] : ["Préparez au moins une collection et une fiche produit valide."]),
    ...(hasExistingCatalogue ? ["Un catalogue réel existe déjà pour cette boutique. Cette étape ne remplace ni ne supprime de données existantes."] : []),
  ];

  return {
    categories,
    products,
    blockers,
    canPublishCatalogue: blockers.length === 0,
    manualAcknowledgements: [
      "J’ai visualisé les catégories et les fiches qui seront créées.",
      "Je confirme que les brouillons actuels ne contiennent ni images ni variantes et que leur absence est acceptable pour cette première publication.",
      "Je confirme les règles de disponibilité, livraison, retours, informations légales et domaine avant toute ouverture publique ultérieure.",
    ],
    cataloguePublicationExecuted: false as const,
    publicCartExecuted: false as const,
    publicActivationExecuted: false as const,
  };
}
