import { describe, expect, it } from "vitest";
import { buildOwnerSalesSettlementOverview } from "./ownerSalesSettlement";

describe("owner sales settlement overview", () => {
  it("separates Test and Production Direct Charges without mixing currencies", () => {
    const result = buildOwnerSalesSettlementOverview([
      { id: 1, paymentMethod: "stripe_connect_test", paymentStatus: "paid", totalAmount: 10_000, currencyCode: "CHF", stripeApplicationFeeAmount: 250, stripeCommissionRateBps: 250, status: "processing", createdAt: "2026-09-28T00:00:00.000Z" },
      { id: 2, paymentMethod: "stripe_connect_live", paymentStatus: "paid", totalAmount: 7_900, currencyCode: "CHF", stripeApplicationFeeAmount: 79, stripeCommissionRateBps: 100, status: "delivered", createdAt: "2026-09-28T01:00:00.000Z" },
      { id: 3, paymentMethod: "stripe_connect_live", paymentStatus: "paid", totalAmount: 10_000, currencyCode: "EUR", stripeApplicationFeeAmount: 100, stripeCommissionRateBps: 100, status: "processing", createdAt: "2026-09-28T02:00:00.000Z" },
    ]);

    expect(result.buckets).toEqual(expect.arrayContaining([
      expect.objectContaining({ mode: "test", currencyCode: "CHF", paidOrderCount: 1, paidGrossCents: 10_000, platformFeeCents: 250, merchantNetEstimateCents: 9_750 }),
      expect.objectContaining({ mode: "live", currencyCode: "CHF", paidOrderCount: 1, paidGrossCents: 7_900, platformFeeCents: 79, merchantNetEstimateCents: 7_821 }),
      expect.objectContaining({ mode: "live", currencyCode: "EUR", paidOrderCount: 1, paidGrossCents: 10_000, platformFeeCents: 100, merchantNetEstimateCents: 9_900 }),
    ]));
  });

  it("excludes unpaid orders and keeps refunded orders separate", () => {
    const result = buildOwnerSalesSettlementOverview([
      { id: 11, paymentMethod: "stripe_connect_test", paymentStatus: "unpaid", totalAmount: 5_000, currencyCode: "CHF", stripeApplicationFeeAmount: 125, stripeCommissionRateBps: 250, status: "pending", createdAt: "2026-09-28T00:00:00.000Z" },
      { id: 12, paymentMethod: "stripe_connect_test", paymentStatus: "refunded", totalAmount: 4_000, currencyCode: "CHF", stripeApplicationFeeAmount: 100, stripeCommissionRateBps: 250, status: "cancelled", createdAt: "2026-09-28T00:00:00.000Z" },
      { id: 13, paymentMethod: "manual", paymentStatus: "paid", totalAmount: 3_000, currencyCode: "CHF", stripeApplicationFeeAmount: 0, stripeCommissionRateBps: 0, status: "processing", createdAt: "2026-09-28T00:00:00.000Z" },
    ]);

    expect(result.buckets).toEqual([expect.objectContaining({ mode: "test", currencyCode: "CHF", paidOrderCount: 0, paidGrossCents: 0, refundedOrderCount: 1, refundedGrossCents: 4_000 })]);
    expect(result.recentSales).toEqual([expect.objectContaining({ id: 12, paymentStatus: "refunded" })]);
  });

  it("never lets an invalid stored fee exceed the order total", () => {
    const result = buildOwnerSalesSettlementOverview([
      { id: 21, paymentMethod: "stripe_connect_live", paymentStatus: "paid", totalAmount: 990, currencyCode: "CHF", stripeApplicationFeeAmount: 9_999, stripeCommissionRateBps: 1_000_000, status: "processing", createdAt: "2026-09-28T00:00:00.000Z" },
    ]);
    expect(result.buckets[0]).toMatchObject({ platformFeeCents: 990, merchantNetEstimateCents: 0 });
    expect(result.recentSales[0]).toMatchObject({ commissionRateBps: 10_000 });
  });
});
