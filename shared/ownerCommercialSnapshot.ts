export type OwnerCommercialSnapshotOrder = {
  id: number;
  totalAmount: number;
  currencyCode: string | null;
  paymentStatus: string;
  createdAt: Date | string;
};

export type OwnerCommercialSnapshotLine = {
  orderId: number;
  productId: number;
  productName: string | null;
  quantity: number;
};

export type OwnerCommercialSnapshot = {
  buckets: Array<{
    currencyCode: string;
    paidOrderCount: number;
    paidRevenueCents: number;
    paidLast30DaysCount: number;
    paidLast30DaysRevenueCents: number;
    averageBasketCents: number;
  }>;
  topProducts: Array<{
    productId: number;
    productName: string;
    quantitySold: number;
  }>;
};

function currencyCode(value: string | null) {
  const normalized = value?.trim().toUpperCase() || "CHF";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "CHF";
}

function safeCents(value: number) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function safeQuantity(value: number) {
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}

/**
 * Read-only commercial aggregation. It only considers locally confirmed paid
 * orders and never receives customer identity, address, card, payout or bank data.
 */
export function buildOwnerCommercialSnapshot(input: {
  orders: OwnerCommercialSnapshotOrder[];
  lines: OwnerCommercialSnapshotLine[];
  now?: Date;
}): OwnerCommercialSnapshot {
  const now = input.now ?? new Date();
  const last30DaysBoundary = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const paidOrderIds = new Set<number>();
  const buckets = new Map<string, OwnerCommercialSnapshot["buckets"][number]>();

  for (const order of input.orders) {
    if (order.paymentStatus !== "paid") continue;
    const amount = safeCents(Number(order.totalAmount));
    const code = currencyCode(order.currencyCode);
    const bucket = buckets.get(code) ?? {
      currencyCode: code,
      paidOrderCount: 0,
      paidRevenueCents: 0,
      paidLast30DaysCount: 0,
      paidLast30DaysRevenueCents: 0,
      averageBasketCents: 0,
    };
    bucket.paidOrderCount += 1;
    bucket.paidRevenueCents += amount;
    const createdAt = new Date(order.createdAt).getTime();
    if (!Number.isNaN(createdAt) && createdAt >= last30DaysBoundary && createdAt <= now.getTime()) {
      bucket.paidLast30DaysCount += 1;
      bucket.paidLast30DaysRevenueCents += amount;
    }
    buckets.set(code, bucket);
    paidOrderIds.add(order.id);
  }

  const completedBuckets = Array.from(buckets.values())
    .map(bucket => ({ ...bucket, averageBasketCents: Math.round(bucket.paidRevenueCents / bucket.paidOrderCount) }))
    .sort((left, right) => left.currencyCode.localeCompare(right.currencyCode));

  const products = new Map<number, { productId: number; productName: string; quantitySold: number }>();
  for (const line of input.lines) {
    if (!paidOrderIds.has(line.orderId)) continue;
    const quantity = safeQuantity(Number(line.quantity));
    if (!quantity) continue;
    const current = products.get(line.productId) ?? {
      productId: line.productId,
      productName: line.productName?.trim() || "Produit archivé",
      quantitySold: 0,
    };
    current.quantitySold += quantity;
    products.set(line.productId, current);
  }

  return {
    buckets: completedBuckets,
    topProducts: Array.from(products.values())
      .sort((left, right) => right.quantitySold - left.quantitySold || left.productName.localeCompare(right.productName))
      .slice(0, 5),
  };
}
