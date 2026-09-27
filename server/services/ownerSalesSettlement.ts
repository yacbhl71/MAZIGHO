import type { StripeConnectMode } from "./stripeConnectMode";

export type OwnerStripeSaleRow = {
  id: number;
  totalAmount: number;
  currencyCode: string | null;
  paymentStatus: "unpaid" | "paid" | "refunded" | string;
  paymentMethod: string | null;
  stripeApplicationFeeAmount: number | null;
  stripeCommissionRateBps: number | null;
  createdAt: Date | string;
  status: string;
};

export type OwnerSalesSettlementBucket = {
  mode: StripeConnectMode;
  currencyCode: string;
  paidOrderCount: number;
  paidGrossCents: number;
  platformFeeCents: number;
  merchantNetEstimateCents: number;
  refundedOrderCount: number;
  refundedGrossCents: number;
};

export type OwnerSalesSettlementOverview = {
  buckets: OwnerSalesSettlementBucket[];
  recentSales: Array<{
    id: number;
    mode: StripeConnectMode;
    totalAmount: number;
    currencyCode: string;
    paymentStatus: "paid" | "refunded";
    platformFeeAmount: number;
    commissionRateBps: number;
    status: string;
    createdAt: Date | string;
  }>;
};

function getStripeConnectMode(paymentMethod: string | null): StripeConnectMode | null {
  if (paymentMethod === "stripe_connect_test") return "test";
  if (paymentMethod === "stripe_connect_live") return "live";
  return null;
}

function safeNonNegativeInteger(value: number | null | undefined) {
  return Number.isSafeInteger(value) && (value ?? 0) >= 0 ? Number(value) : 0;
}

/**
 * Builds a read-only settlement view from store-scoped orders. It intentionally
 * reports only Direct Charges confirmed by the local verified webhook flow.
 * Stripe processing fees, taxes, payouts, disputes and refunds are not inferred.
 */
export function buildOwnerSalesSettlementOverview(rows: OwnerStripeSaleRow[]): OwnerSalesSettlementOverview {
  const buckets = new Map<string, OwnerSalesSettlementBucket>();
  const recentSales: OwnerSalesSettlementOverview["recentSales"] = [];

  for (const row of rows) {
    const mode = getStripeConnectMode(row.paymentMethod);
    if (!mode || (row.paymentStatus !== "paid" && row.paymentStatus !== "refunded")) continue;

    const currencyCode = (row.currencyCode || "CHF").trim().toUpperCase().slice(0, 3) || "CHF";
    const key = `${mode}:${currencyCode}`;
    const bucket = buckets.get(key) ?? {
      mode,
      currencyCode,
      paidOrderCount: 0,
      paidGrossCents: 0,
      platformFeeCents: 0,
      merchantNetEstimateCents: 0,
      refundedOrderCount: 0,
      refundedGrossCents: 0,
    };
    const totalAmount = safeNonNegativeInteger(row.totalAmount);
    const platformFeeAmount = Math.min(totalAmount, safeNonNegativeInteger(row.stripeApplicationFeeAmount));
    const commissionRateBps = Math.min(10_000, safeNonNegativeInteger(row.stripeCommissionRateBps));

    if (row.paymentStatus === "paid") {
      bucket.paidOrderCount += 1;
      bucket.paidGrossCents += totalAmount;
      bucket.platformFeeCents += platformFeeAmount;
      bucket.merchantNetEstimateCents += totalAmount - platformFeeAmount;
    } else {
      bucket.refundedOrderCount += 1;
      bucket.refundedGrossCents += totalAmount;
    }
    buckets.set(key, bucket);

    recentSales.push({
      id: row.id,
      mode,
      totalAmount,
      currencyCode,
      paymentStatus: row.paymentStatus === "paid" ? "paid" : "refunded",
      platformFeeAmount,
      commissionRateBps,
      status: row.status,
      createdAt: row.createdAt,
    });
  }

  return {
    buckets: Array.from(buckets.values()).sort((left, right) => left.currencyCode.localeCompare(right.currencyCode) || left.mode.localeCompare(right.mode)),
    recentSales: recentSales.slice(0, 20),
  };
}
