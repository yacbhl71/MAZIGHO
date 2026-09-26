import { DEFAULT_STORE_MEDIA_QUOTA_BYTES } from "../storage";

export type TenantResourceCounters = {
  clientStores: number;
  categories: number;
  products: number;
  productImages: number;
  variants: number;
  orders: number;
  carts: number;
  cartItems: number;
  settings: number;
};

/**
 * Produces an honest tenant resource summary from countable database rows. It
 * intentionally does not estimate database bytes or traffic: neither can be
 * inferred accurately from the application database without provider metrics.
 */
export function buildTenantResourceSummary(counters: TenantResourceCounters, generatedAt = new Date().toISOString()) {
  const records = [counters.categories, counters.products, counters.productImages, counters.variants, counters.orders, counters.carts, counters.cartItems, counters.settings]
    .reduce((total, value) => total + Math.max(0, Math.trunc(value || 0)), 0);
  const stores = Math.max(0, Math.trunc(counters.clientStores || 0));
  return {
    generatedAt,
    clientStores: stores,
    database: {
      trackedRecords: records,
      counters: {
        catalogue: Math.max(0, Math.trunc(counters.categories || 0)) + Math.max(0, Math.trunc(counters.products || 0)) + Math.max(0, Math.trunc(counters.productImages || 0)) + Math.max(0, Math.trunc(counters.variants || 0)),
        operations: Math.max(0, Math.trunc(counters.orders || 0)) + Math.max(0, Math.trunc(counters.carts || 0)) + Math.max(0, Math.trunc(counters.cartItems || 0)),
        settings: Math.max(0, Math.trunc(counters.settings || 0)),
      },
      status: "record_count" as const,
      detail: "Nombre d’enregistrements cloisonnés. Ce n’est pas une mesure d’octets de base de données.",
    },
    media: {
      quotaCeilingBytes: stores * DEFAULT_STORE_MEDIA_QUOTA_BYTES,
      perStoreQuotaBytes: DEFAULT_STORE_MEDIA_QUOTA_BYTES,
      status: "on_demand" as const,
      detail: "Le volume Blob réel est lu à la demande, boutique par boutique, afin de ne pas parcourir tout le stockage partagé à chaque ouverture de Studio.",
    },
    traffic: {
      status: "not_connected" as const,
      detail: "Le trafic et la bande passante par boutique exigent une source de métriques dédiée. Aucune estimation n’est affichée.",
    },
  };
}
