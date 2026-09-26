export const studioCustomDomainPageSizes = [20, 50, 100] as const;
export const studioCustomDomainConnectionFilters = ["requested", "guide_ready", "client_acknowledged", "linked", "recovery_active", "needs_attention"] as const;

export type StudioCustomDomainPageSize = typeof studioCustomDomainPageSizes[number];
export type StudioCustomDomainConnectionFilter = typeof studioCustomDomainConnectionFilters[number];
export type StudioCustomDomainConnectionStatus = "recovery_only" | "requested" | "guide_ready" | "client_acknowledged" | "linked" | "recovery_active" | "legacy_custom_domain";

export type StudioCustomDomainRegistryQuery = {
  query?: string;
  status?: StudioCustomDomainConnectionFilter;
  page?: number;
  pageSize?: StudioCustomDomainPageSize;
};

type DomainRegistryStore = {
  displayName: string;
  slug: string;
  primaryDomain: string;
  connectionStatus: StudioCustomDomainConnectionStatus;
};

export function normalizeStudioCustomDomainRegistryQuery(input: StudioCustomDomainRegistryQuery = {}) {
  const query = input.query?.trim().replace(/\s+/g, " ").slice(0, 80) || undefined;
  const status = studioCustomDomainConnectionFilters.includes(input.status as StudioCustomDomainConnectionFilter)
    ? input.status as StudioCustomDomainConnectionFilter
    : undefined;
  const pageSize = studioCustomDomainPageSizes.includes(input.pageSize as StudioCustomDomainPageSize)
    ? input.pageSize as StudioCustomDomainPageSize
    : 20;
  const page = Number.isInteger(input.page) && (input.page ?? 0) > 0 ? input.page as number : 1;
  return { query, status, page, pageSize };
}

function matchesConnectionStatus(store: DomainRegistryStore, status?: StudioCustomDomainConnectionFilter) {
  if (!status) return true;
  if (status === "needs_attention") return ["requested", "guide_ready", "client_acknowledged", "recovery_active"].includes(store.connectionStatus);
  return store.connectionStatus === status;
}

export function paginateStudioCustomDomainRegistry<T extends DomainRegistryStore>(stores: readonly T[], input: StudioCustomDomainRegistryQuery = {}) {
  const filters = normalizeStudioCustomDomainRegistryQuery(input);
  const normalizedQuery = filters.query?.toLocaleLowerCase("fr-CH");
  const filtered = stores.filter(store => {
    const matchesQuery = !normalizedQuery || [store.displayName, store.slug, store.primaryDomain]
      .some(value => value.toLocaleLowerCase("fr-CH").includes(normalizedQuery));
    return matchesQuery && matchesConnectionStatus(store, filters.status);
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const offset = (page - 1) * filters.pageSize;
  return {
    stores: filtered.slice(offset, offset + filters.pageSize),
    pagination: { page, pageSize: filters.pageSize, total, totalPages, from: total === 0 ? 0 : offset + 1, to: Math.min(offset + filters.pageSize, total) },
    filters: { query: filters.query ?? null, status: filters.status ?? null },
  };
}
