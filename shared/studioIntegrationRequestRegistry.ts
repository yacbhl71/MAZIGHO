import { storeIntegrationIds, type StoreIntegrationId } from "./storeIntegrationRequests";

export const studioIntegrationRequestPageSizes = [20, 50, 100] as const;
export const studioIntegrationStoreStatuses = ["setup", "active", "limited", "suspended", "closed"] as const;

export type StudioIntegrationRequestPageSize = typeof studioIntegrationRequestPageSizes[number];
export type StudioIntegrationStoreStatus = typeof studioIntegrationStoreStatuses[number];

export type StudioIntegrationRequestRegistryQuery = {
  query?: string;
  integrationId?: StoreIntegrationId;
  status?: StudioIntegrationStoreStatus;
  page?: number;
  pageSize?: StudioIntegrationRequestPageSize;
};

type RegistryRequest = {
  integrationId: StoreIntegrationId;
  requestedAt: string;
  store: { displayName: string; slug: string; primaryDomain: string; status: StudioIntegrationStoreStatus };
};

export function normalizeStudioIntegrationRequestRegistryQuery(input: StudioIntegrationRequestRegistryQuery = {}) {
  const query = input.query?.trim().replace(/\s+/g, " ").slice(0, 80) || undefined;
  const integrationId = storeIntegrationIds.includes(input.integrationId as StoreIntegrationId) ? input.integrationId : undefined;
  const status = studioIntegrationStoreStatuses.includes(input.status as StudioIntegrationStoreStatus) ? input.status : undefined;
  const pageSize = studioIntegrationRequestPageSizes.includes(input.pageSize as StudioIntegrationRequestPageSize) ? input.pageSize as StudioIntegrationRequestPageSize : 20;
  const page = Number.isInteger(input.page) && (input.page ?? 0) > 0 ? input.page as number : 1;
  return { query, integrationId, status, page, pageSize };
}

/** Paginates current owner intents only; it is not an integration, queue assignment, or provider connection. */
export function paginateStudioIntegrationRequestRegistry<T extends RegistryRequest>(requests: readonly T[], input: StudioIntegrationRequestRegistryQuery = {}) {
  const filters = normalizeStudioIntegrationRequestRegistryQuery(input);
  const normalizedQuery = filters.query?.toLocaleLowerCase("fr-CH");
  const filtered = requests.filter(request => {
    const matchesQuery = !normalizedQuery || [request.store.displayName, request.store.slug, request.store.primaryDomain, request.integrationId]
      .some(value => value.toLocaleLowerCase("fr-CH").includes(normalizedQuery));
    return matchesQuery && (!filters.integrationId || request.integrationId === filters.integrationId) && (!filters.status || request.store.status === filters.status);
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const offset = (page - 1) * filters.pageSize;
  return {
    requests: filtered.slice(offset, offset + filters.pageSize),
    pagination: { page, pageSize: filters.pageSize, total, totalPages, from: total === 0 ? 0 : offset + 1, to: Math.min(offset + filters.pageSize, total) },
    filters: { query: filters.query ?? null, integrationId: filters.integrationId ?? null, status: filters.status ?? null },
  };
}
