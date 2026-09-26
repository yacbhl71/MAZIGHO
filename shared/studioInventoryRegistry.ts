import type { StoreCommercialOfferMode } from "./storeCommercialOffer";

export const studioInventoryStatuses = ["setup", "active", "limited", "suspended", "closed"] as const;
export const studioInventoryPageSizes = [20, 50, 100] as const;

export type StudioInventoryStatus = typeof studioInventoryStatuses[number];
export type StudioInventoryPageSize = typeof studioInventoryPageSizes[number];

export type StudioInventoryQuery = {
  query?: string;
  status?: StudioInventoryStatus;
  offerMode?: StoreCommercialOfferMode;
  needsAttention?: boolean;
  page?: number;
  pageSize?: StudioInventoryPageSize;
};

type RegistryStore = {
  displayName: string;
  slug: string;
  primaryDomain: string;
  status: StudioInventoryStatus;
  isPlatformStore: boolean | number;
  commercialOfferMode: StoreCommercialOfferMode;
  needsAttention?: boolean;
};

export function normalizeStudioInventoryQuery(input: StudioInventoryQuery = {}) {
  const query = input.query?.trim().replace(/\s+/g, " ").slice(0, 80) || undefined;
  const status = studioInventoryStatuses.includes(input.status as StudioInventoryStatus) ? input.status : undefined;
  const offerMode = input.offerMode === "rental" || input.offerMode === "perpetual_sale" || input.offerMode === "undecided" ? input.offerMode : undefined;
  const pageSize = studioInventoryPageSizes.includes(input.pageSize as StudioInventoryPageSize) ? input.pageSize as StudioInventoryPageSize : 20;
  const page = Number.isInteger(input.page) && (input.page ?? 0) > 0 ? input.page as number : 1;
  return { query, status, offerMode, needsAttention: input.needsAttention === true ? true : undefined, page, pageSize };
}

export function paginateStudioInventory<T extends RegistryStore>(stores: readonly T[], input: StudioInventoryQuery = {}) {
  const filters = normalizeStudioInventoryQuery(input);
  const normalizedQuery = filters.query?.toLocaleLowerCase("fr-CH");
  const filtered = stores.filter(store => {
    const matchesQuery = !normalizedQuery || [store.displayName, store.slug, store.primaryDomain]
      .some(value => value.toLocaleLowerCase("fr-CH").includes(normalizedQuery));
    const matchesStatus = !filters.status || store.status === filters.status;
    const matchesOffer = !filters.offerMode || (!store.isPlatformStore && store.commercialOfferMode === filters.offerMode);
    const matchesAttention = !filters.needsAttention || store.needsAttention === true;
    return matchesQuery && matchesStatus && matchesOffer && matchesAttention;
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const offset = (page - 1) * filters.pageSize;
  return {
    stores: filtered.slice(offset, offset + filters.pageSize),
    pagination: { page, pageSize: filters.pageSize, total, totalPages, from: total === 0 ? 0 : offset + 1, to: Math.min(offset + filters.pageSize, total) },
    filters: { query: filters.query ?? null, status: filters.status ?? null, offerMode: filters.offerMode ?? null, needsAttention: filters.needsAttention ?? null },
  };
}
