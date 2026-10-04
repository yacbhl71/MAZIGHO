export const OWNER_MANUAL_TRACKING_LIMITS = {
  carrier: 120,
  number: 100,
  url: 1000,
} as const;

/**
 * A manually entered tracking address may only open an ordinary HTTP(S) page.
 * It is never fetched, called or sent to a carrier by MAZIGHO.
 */
export function isSafeOwnerManualTrackingUrl(value: string | null | undefined) {
  const normalized = value?.trim() || "";
  if (!normalized) return true;
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
