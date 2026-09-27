export type StockReservationSourceLine = {
  productId: number;
  quantity: number;
  supplierSnapshot?: unknown;
};

export type CheckoutStockReservation = {
  productId: number;
  variantId: number | null;
  quantity: number;
};

function ownerVariantId(snapshot: unknown): number | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const ownerVariant = (snapshot as { ownerVariant?: unknown }).ownerVariant;
  if (!ownerVariant || typeof ownerVariant !== "object") return null;
  const id = (ownerVariant as { id?: unknown }).id;
  return typeof id === "number" && Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Groups one checkout's lines into atomic inventory reservations. A selected
 * owner variant consumes variant stock; all other lines consume product stock.
 */
export function buildCheckoutStockReservations(lines: StockReservationSourceLine[]): CheckoutStockReservation[] {
  const aggregated = new Map<string, CheckoutStockReservation>();
  for (const line of lines) {
    if (!Number.isInteger(line.productId) || line.productId <= 0 || !Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("CHECKOUT_STOCK_RESERVATION_INVALID");
    }
    const variantId = ownerVariantId(line.supplierSnapshot);
    const key = `${line.productId}:${variantId ?? "product"}`;
    const current = aggregated.get(key);
    if (current) current.quantity += line.quantity;
    else aggregated.set(key, { productId: line.productId, variantId, quantity: line.quantity });
  }
  return Array.from(aggregated.values());
}

/**
 * Parses only explicitly marked order snapshots when an expired/unbound checkout
 * releases stock. Historical pending orders without this marker were not
 * reserved and must never add inventory back.
 */
export function buildStoredOrderStockReservations(lines: Array<{ productId: number; quantity: number; supplierSnapshot?: string | null }>): CheckoutStockReservation[] {
  const markedLines: StockReservationSourceLine[] = [];
  for (const line of lines) {
    let supplierSnapshot: unknown = null;
    try {
      supplierSnapshot = line.supplierSnapshot ? JSON.parse(line.supplierSnapshot) : null;
    } catch {
      // A malformed historical snapshot can only be treated as a product line;
      // it must never target an arbitrary variant.
      supplierSnapshot = null;
    }
    if ((supplierSnapshot as { inventoryReservation?: unknown } | null)?.inventoryReservation !== true) continue;
    markedLines.push({ productId: line.productId, quantity: line.quantity, supplierSnapshot });
  }
  return buildCheckoutStockReservations(markedLines);
}
