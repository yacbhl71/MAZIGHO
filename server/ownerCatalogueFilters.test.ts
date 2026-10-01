import { describe, expect, it } from "vitest";
import { filterOwnerCatalogue, paginateOwnerCatalogue } from "../client/src/lib/ownerCatalogueFilters";

const products = [
  { id: 1, name: "Robe été", slug: "robe-ete", description: "Coton", status: "active", categoryId: 12, categoryIds: [12, 22] },
  { id: 2, name: "Écharpe violette", slug: "echarpe-violette", description: "Laine", status: "draft", categoryId: 22, categoryIds: [22] },
  { id: 3, name: "Ancien bijou", slug: "bijou", description: "Perles", status: "archived", categoryId: 31, categoryIds: [] },
];
describe("catalogue privé", () => {
  it("cherche dans les fiches actives, brouillons et archivées avec accents et référence", () => {
    expect(filterOwnerCatalogue(products, { query: "echarpe", status: "all", categoryId: "" }).map(row => row.id)).toEqual([2]);
    expect(filterOwnerCatalogue(products, { query: "3", status: "all", categoryId: "" }).map(row => row.id)).toEqual([3]);
    expect(filterOwnerCatalogue(products, { query: "robe", status: "draft", categoryId: "" })).toEqual([]);
  });
  it("respecte toutes les catégories associées à une fiche", () => {
    expect(filterOwnerCatalogue(products, { query: "", status: "all", categoryId: "22" }).map(row => row.id)).toEqual([1, 2]);
    expect(filterOwnerCatalogue(products, { query: "", status: "archived", categoryId: "22" })).toEqual([]);
  });
  it("limite les fiches affichées et rétablit la dernière page si le filtre change", () => {
    expect(paginateOwnerCatalogue(products, 2, 2)).toMatchObject({ page: 2, pages: 2, total: 3, rows: [products[2]] });
    expect(paginateOwnerCatalogue(products.slice(0, 1), 8, 2)).toMatchObject({ page: 1, pages: 1, total: 1 });
  });
});
