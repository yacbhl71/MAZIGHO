export function getProductDiscountPercentage(priceCents: number, originalPriceCents: number | null | undefined) {
  if (!Number.isInteger(priceCents) || !Number.isInteger(originalPriceCents) || priceCents < 0 || originalPriceCents == null || originalPriceCents <= priceCents) return null;
  return Math.round(((originalPriceCents - priceCents) / originalPriceCents) * 100);
}

export function hasProductPromotion(priceCents: number, originalPriceCents: number | null | undefined) {
  return getProductDiscountPercentage(priceCents, originalPriceCents) !== null;
}
