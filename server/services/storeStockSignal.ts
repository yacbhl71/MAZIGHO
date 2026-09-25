export type StoreStockSignalProduct = {
  id: number;
  storeId: number;
  status: string;
  stock: number | null | undefined;
};

export type StoreStockSignalVariant = {
  productId: number;
  storeId: number;
  status: string;
  stock: number | null | undefined;
};

export type StoreStockSignal = {
  tracked: number;
  available: number;
  low: number;
  out: number;
  lowStockThreshold: number;
};

/**
 * Produces an aggregate, non-identifying stock signal for one boutique.
 * Active variants replace the product's global stock because that is also the
 * storefront's availability rule. Product names, SKUs and quantities per line
 * never leave this helper.
 */
export function buildStoreStockSignal(input: {
  products: readonly StoreStockSignalProduct[];
  variants: readonly StoreStockSignalVariant[];
  lowStockThreshold: number;
}): StoreStockSignal {
  const lowStockThreshold = Number.isInteger(input.lowStockThreshold) && input.lowStockThreshold >= 0 ? input.lowStockThreshold : 5;
  const activeVariantsByProduct = new Map<number, StoreStockSignalVariant[]>();
  for (const variant of input.variants) {
    if (variant.status !== "active") continue;
    const current = activeVariantsByProduct.get(variant.productId) ?? [];
    current.push(variant);
    activeVariantsByProduct.set(variant.productId, current);
  }

  let tracked = 0;
  let available = 0;
  let low = 0;
  let out = 0;
  const register = (stock: number | null | undefined) => {
    tracked += 1;
    const quantity = Math.max(0, Number.isFinite(Number(stock)) ? Math.trunc(Number(stock)) : 0);
    if (quantity <= 0) out += 1;
    else if (quantity <= lowStockThreshold) low += 1;
    else available += 1;
  };

  for (const product of input.products) {
    if (product.status !== "active") continue;
    const activeVariants = activeVariantsByProduct.get(product.id) ?? [];
    if (activeVariants.length) activeVariants.forEach(variant => register(variant.stock));
    else register(product.stock);
  }

  return { tracked, available, low, out, lowStockThreshold };
}
