export const STORE_PRODUCT_BUNDLE_LIMITS = {
  bundles: 12,
  productsPerBundle: 3,
  name: 120,
  description: 360,
  promoCode: 64,
} as const;

export type StoreProductBundle = {
  id: string;
  name: string;
  description: string;
  productIds: number[];
  promoCode: string | null;
  enabled: boolean;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as UnknownRecord : null;
}

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function normalizeId(value: unknown) {
  const id = normalizeText(value, 96);
  return /^bundle_[a-z0-9-]{8,90}$/i.test(id) ? id : null;
}

/**
 * Keeps a bundle as a simple customer-facing selection of real products.
 * It owns neither price nor stock: those remain verified for every product line
 * by the normal checkout transaction.
 */
export function normalizeStoreProductBundles(value: unknown): StoreProductBundle[] {
  const source = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const result: StoreProductBundle[] = [];

  for (const raw of source) {
    if (result.length >= STORE_PRODUCT_BUNDLE_LIMITS.bundles) break;
    const record = asRecord(raw);
    if (!record) continue;
    const id = normalizeId(record.id);
    const name = normalizeText(record.name, STORE_PRODUCT_BUNDLE_LIMITS.name);
    const productIds = Array.isArray(record.productIds)
      ? Array.from(new Set(record.productIds.map(Number).filter(productId => Number.isInteger(productId) && productId > 0))).slice(0, STORE_PRODUCT_BUNDLE_LIMITS.productsPerBundle)
      : [];
    if (!id || seen.has(id) || name.length < 2 || productIds.length < 2) continue;
    seen.add(id);
    const promoCode = normalizeText(record.promoCode, STORE_PRODUCT_BUNDLE_LIMITS.promoCode).toUpperCase() || null;
    result.push({
      id,
      name,
      description: normalizeText(record.description, STORE_PRODUCT_BUNDLE_LIMITS.description),
      productIds,
      promoCode,
      enabled: record.enabled === true || record.enabled === 1,
    });
  }

  return result;
}

export function parseStoreProductBundles(value: unknown): StoreProductBundle[] {
  if (typeof value !== "string") return normalizeStoreProductBundles(value);
  try { return normalizeStoreProductBundles(JSON.parse(value)); }
  catch { return []; }
}

/** Preserves the owner-configured order and ignores a stale product reference. */
export function orderBundleProducts<T extends { id: number }>(bundle: Pick<StoreProductBundle, "productIds">, products: T[]) {
  const byId = new Map(products.map(product => [product.id, product]));
  return bundle.productIds.flatMap(productId => {
    const product = byId.get(productId);
    return product ? [product] : [];
  });
}
