export type StorefrontDeliveryProfile = {
  countryCode: string;
};

/**
 * Locally managed products are added directly by the owner, with local stock
 * and no supplier quotation. A client boutique can sell these products in all
 * of its enabled markets; its store-wide shipping rules remain the only
 * customer-facing delivery charge.
 */
export function canUseManualProductDelivery(
  isClientStore: boolean,
  isManualProduct: boolean | null | undefined,
): boolean {
  return isClientStore && Boolean(isManualProduct);
}

/**
 * Products supplied through a provider need a country-specific quote before
 * they are shown or sold. A client boutique's own manual products are exempt:
 * their stock and delivery are managed directly by the owner rather than by a
 * dropshipping supplier.
 */
export function isProductVisibleForStorefront(
  profiles: StorefrontDeliveryProfile[] | null | undefined,
  countryCode: string,
  isClientStore: boolean,
  isManualProduct = false,
): boolean {
  const normalizedCountry = countryCode.trim().toUpperCase();
  const hasConfirmedDelivery = profiles?.some(profile => profile.countryCode.trim().toUpperCase() === normalizedCountry) ?? false;
  if (hasConfirmedDelivery) return true;

  return canUseManualProductDelivery(isClientStore, isManualProduct);
}

/**
 * The same criterion is shared by public listing controls and the product
 * detail page so a manually stocked client product cannot be displayed but
 * blocked when added to the basket.
 */
export function isProductPurchasableForStorefront(
  profiles: StorefrontDeliveryProfile[] | null | undefined,
  countryCode: string,
  isClientStore: boolean,
  isManualProduct = false,
): boolean {
  return isProductVisibleForStorefront(profiles, countryCode, isClientStore, isManualProduct);
}
