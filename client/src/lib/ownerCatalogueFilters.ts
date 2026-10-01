import { normalizeOwnerSearch } from "./ownerAdminNavigation";

export type OwnerCatalogueProduct = {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  status?: string | null;
  categoryId?: number | null;
  categoryIds?: number[] | null;
};
export type OwnerProductFilters = { query: string; status: string; categoryId: string };

export function filterOwnerCatalogue<T extends OwnerCatalogueProduct>(products: T[], filters: OwnerProductFilters): T[] {
  const needle = normalizeOwnerSearch(filters.query);
  const categoryId = /^\d+$/.test(filters.categoryId) ? Number(filters.categoryId) : null;
  return products.filter(product => {
    if (filters.status !== "all" && product.status !== filters.status) return false;
    if (categoryId !== null && product.categoryId !== categoryId && !product.categoryIds?.includes(categoryId)) return false;
    if (!needle) return true;
    return [product.name, product.slug, product.description, String(product.id)].some(value => normalizeOwnerSearch(value || "").includes(needle));
  });
}

export function paginateOwnerCatalogue<T>(rows: T[], currentPage: number, pageSize = 18) {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(Math.max(1, Math.floor(currentPage) || 1), pages);
  return { rows: rows.slice((page - 1) * pageSize, page * pageSize), page, pages, total: rows.length };
}
