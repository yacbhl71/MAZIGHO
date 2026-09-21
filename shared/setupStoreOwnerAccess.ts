export const setupStoreAccessHeader = "x-mazigho-setup-store-id";
export const setupStoreAccessQuery = "preparation";

/**
 * Accept only a bounded positive database identifier. This value is a routing
 * hint; the server still verifies both the store state and active membership.
 */
export function parseSetupStoreId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const normalized = String(raw).trim();
  if (!/^[1-9]\d{0,9}$/.test(normalized)) return null;
  const id = Number(normalized);
  return Number.isSafeInteger(id) && id <= 2_147_483_647 ? id : null;
}

export function getSetupStoreIdFromSearch(search: string): number | null {
  return parseSetupStoreId(new URLSearchParams(search).get(setupStoreAccessQuery));
}

export function getSetupOwnerPanelPath(storeId: number): string {
  const id = parseSetupStoreId(storeId);
  return id ? `/gestion-boutique?${setupStoreAccessQuery}=${id}` : "/gestion-boutique";
}

export function isPrivateSetupOwnerPanelPath(pathname: string, search: string): boolean {
  return pathname === "/gestion-boutique" && getSetupStoreIdFromSearch(search) !== null;
}
