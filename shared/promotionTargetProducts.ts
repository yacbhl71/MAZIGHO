export const PROMOTION_TARGET_PRODUCT_LIMIT = 30;

export type PromotionTargetCartItem = {
  productId: number;
  price: number;
  quantity: number;
};

/**
 * Normalizes only integer product IDs. This is used at each persistence and
 * checkout boundary so a promotion never relies on a client-provided amount.
 */
export function normalizePromotionTargetProductIds(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  const ids: number[] = [];
  for (const value of input) {
    const id = typeof value === "number" ? value : Number(value);
    if (Number.isInteger(id) && id > 0 && !ids.includes(id)) ids.push(id);
    if (ids.length >= PROMOTION_TARGET_PRODUCT_LIMIT) break;
  }
  return ids;
}

export function parsePromotionTargetProductIds(value: unknown): number[] {
  if (Array.isArray(value)) return normalizePromotionTargetProductIds(value);
  if (typeof value !== "string" || !value.trim()) return [];
  try { return normalizePromotionTargetProductIds(JSON.parse(value)); }
  catch { return []; }
}

/** Returns the canonical CHF subtotal of only the targeted cart lines. */
export function getPromotionTargetProductsSubtotal(items: PromotionTargetCartItem[], targetProductIds: number[]): number {
  const targets = new Set(normalizePromotionTargetProductIds(targetProductIds));
  if (!targets.size) return 0;
  return items.reduce((total, item) => {
    if (!targets.has(item.productId)) return total;
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(price) || price < 0 || !Number.isInteger(quantity) || quantity < 1) return total;
    return total + price * quantity;
  }, 0);
}
