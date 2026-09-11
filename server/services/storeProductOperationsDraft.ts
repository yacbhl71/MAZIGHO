export const studioStockStates = ["to_confirm", "in_stock", "limited", "out_of_stock"] as const;

export type StudioStockState = (typeof studioStockStates)[number];

export type StudioProductOperationDraft = {
  productId: string;
  stockState: StudioStockState;
  stockQuantity: number;
  supplierName: string;
  supplierReference: string;
};

export type StudioProductOperationProduct = {
  id: string;
  name: string;
};

const MAX_STOCK_QUANTITY = 999_999;
const MAX_SUPPLIER_NAME_LENGTH = 96;
const MAX_SUPPLIER_REFERENCE_LENGTH = 128;

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function cleanQuantity(value: unknown) {
  const numeric = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
  return Math.max(0, Math.min(MAX_STOCK_QUANTITY, numeric));
}

function cleanStockState(value: unknown): StudioStockState {
  return typeof value === "string" && (studioStockStates as readonly string[]).includes(value)
    ? value as StudioStockState
    : "to_confirm";
}

/**
 * Closed, Studio-only operational preparation. It is keyed only to the private
 * product concepts already prepared for one store. It deliberately strips URLs,
 * contacts, credentials, supplier prices, shipping, variants and purchase data.
 */
export function normalizeStudioProductOperationDrafts(value: unknown, products: StudioProductOperationProduct[]) {
  const submitted = new Map<string, Record<string, unknown>>();
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as Record<string, unknown>;
      const productId = cleanText(item.productId, 32);
      if (productId && !submitted.has(productId)) submitted.set(productId, item);
    }
  }

  return products.map(product => {
    const item = submitted.get(product.id);
    const stockState = cleanStockState(item?.stockState);
    return {
      productId: product.id,
      stockState,
      stockQuantity: stockState === "in_stock" || stockState === "limited" ? cleanQuantity(item?.stockQuantity) : 0,
      supplierName: cleanText(item?.supplierName, MAX_SUPPLIER_NAME_LENGTH),
      supplierReference: cleanText(item?.supplierReference, MAX_SUPPLIER_REFERENCE_LENGTH),
    } satisfies StudioProductOperationDraft;
  });
}

export const studioProductOperationDraftLimits = {
  maxStockQuantity: MAX_STOCK_QUANTITY,
  maxSupplierNameLength: MAX_SUPPLIER_NAME_LENGTH,
  maxSupplierReferenceLength: MAX_SUPPLIER_REFERENCE_LENGTH,
} as const;
