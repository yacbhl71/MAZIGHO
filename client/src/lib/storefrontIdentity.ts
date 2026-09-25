import type { DesignProfile } from "@/hooks/useDesignProfile";

/**
 * Returns the customer-facing brand for the currently resolved storefront.
 * The platform storefront intentionally keeps MAZIGHO as its default.
 */
export function getStorefrontBrandName(profile?: Pick<DesignProfile, "brandName"> | null) {
  return profile?.brandName?.trim() || "MAZIGHO";
}

/**
 * Replaces the platform's historical customer-facing name inside static copy.
 * It accepts nested locale-copy objects so each storefront can retain its
 * own identity without duplicating every translated source string.
 */
export function withStorefrontBrand<T>(value: T, brandName: string): T {
  if (typeof value === "string") return value.replaceAll("MAZIGHO", brandName) as T;
  if (Array.isArray(value)) return value.map(item => withStorefrontBrand(item, brandName)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, withStorefrontBrand(item, brandName)])) as T;
  }
  return value;
}
