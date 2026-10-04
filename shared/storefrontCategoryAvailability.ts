export type StorefrontCategoryAvailability = "available" | "empty" | "delivery_unavailable";

/**
 * Separates a genuinely empty category from a category whose existing products
 * are hidden only because the current delivery destination is unsupported.
 */
export function getStorefrontCategoryAvailability(input: {
  totalProducts: number;
  visibleProducts: number;
}): StorefrontCategoryAvailability {
  if (input.totalProducts <= 0) return "empty";
  return input.visibleProducts > 0 ? "available" : "delivery_unavailable";
}
