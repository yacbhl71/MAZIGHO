export type StorefrontDeliveryProfile = {
  countryCode: string;
};

/**
 * A confirmed delivery profile remains mandatory before a product can enter a
 * cart. Client boutiques may nevertheless present imported manual catalogue
 * products that have no delivery profile yet, so their owners can review the
 * public product pages before verifying logistics. The fallback never applies
 * to a product that already has profiles for other destinations.
 */
export function isProductVisibleForStorefront(
  profiles: StorefrontDeliveryProfile[] | null | undefined,
  countryCode: string,
  isClientStore: boolean,
): boolean {
  const normalizedCountry = countryCode.trim().toUpperCase();
  const hasConfirmedDelivery = profiles?.some(profile => profile.countryCode.trim().toUpperCase() === normalizedCountry) ?? false;
  if (hasConfirmedDelivery) return true;

  const hasAnyDeliveryProfile = (profiles?.length ?? 0) > 0;
  return isClientStore && !hasAnyDeliveryProfile;
}
