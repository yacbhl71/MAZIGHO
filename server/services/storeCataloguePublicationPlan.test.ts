import { describe, expect, it } from "vitest";
import { buildStoreCataloguePublicationPlan } from "./storeCataloguePublicationPlan";

describe("buildStoreCataloguePublicationPlan", () => {
  const input = {
    status: "setup" as const,
    privatePreparationReady: true,
    existingCategoryCount: 0,
    existingProductCount: 0,
    collections: [{ id: "collection-1", title: "Essentiels animaux", description: "Des essentiels pour le quotidien.", featured: true }],
    products: [{ id: "product-1", name: "Bol de voyage", description: "Un bol léger pour les sorties.", collectionId: "collection-1", priceCents: 1990, featured: true }],
    operations: [{ productId: "product-1", stockState: "limited" as const, stockQuantity: 4, supplierName: "", supplierReference: "" }],
  };

  it("prépare une copie réelle déterministe sans prétendre inclure médias ou variantes", () => {
    const result = buildStoreCataloguePublicationPlan(input);

    expect(result.canPublishCatalogue).toBe(true);
    expect(result.categories).toEqual([expect.objectContaining({ slug: "essentiels-animaux", displayOrder: 1 })]);
    expect(result.products).toEqual([expect.objectContaining({ slug: "bol-de-voyage", stock: 4, imagesIncluded: false, variantsIncluded: false })]);
    expect(result.cataloguePublicationExecuted).toBe(false);
    expect(result.publicCartExecuted).toBe(false);
    expect(result.publicActivationExecuted).toBe(false);
  });

  it("bloque toute publication qui écraserait un catalogue existant ou sortirait de setup", () => {
    const result = buildStoreCataloguePublicationPlan({ ...input, status: "active", existingProductCount: 1 });

    expect(result.canPublishCatalogue).toBe(false);
    expect(result.blockers).toHaveLength(2);
    expect(result.blockers.join(" ")).toMatch(/catalogue réel existe déjà/i);
  });
});
