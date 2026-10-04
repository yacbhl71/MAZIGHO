import { describe, expect, it } from "vitest";
import { buildOwnerCommercialSnapshot } from "../shared/ownerCommercialSnapshot";

describe("owner commercial snapshot", () => {
  it("keeps only paid orders and separates currencies", () => {
    const snapshot = buildOwnerCommercialSnapshot({
      now: new Date("2026-10-04T12:00:00.000Z"),
      orders: [
        { id: 1, totalAmount: 4200, currencyCode: "CHF", paymentStatus: "paid", createdAt: "2026-10-02T12:00:00.000Z" },
        { id: 2, totalAmount: 5100, currencyCode: "CHF", paymentStatus: "unpaid", createdAt: "2026-10-03T12:00:00.000Z" },
        { id: 3, totalAmount: 180000, currencyCode: "DZD", paymentStatus: "paid", createdAt: "2026-08-01T12:00:00.000Z" },
      ],
      lines: [
        { orderId: 1, productId: 9, productName: "Carnet", quantity: 2 },
        { orderId: 2, productId: 9, productName: "Carnet", quantity: 8 },
        { orderId: 3, productId: 4, productName: "Affiche", quantity: 1 },
      ],
    });

    expect(snapshot.buckets).toEqual([
      { currencyCode: "CHF", paidOrderCount: 1, paidRevenueCents: 4200, paidLast30DaysCount: 1, paidLast30DaysRevenueCents: 4200, averageBasketCents: 4200 },
      { currencyCode: "DZD", paidOrderCount: 1, paidRevenueCents: 180000, paidLast30DaysCount: 0, paidLast30DaysRevenueCents: 0, averageBasketCents: 180000 },
    ]);
    expect(snapshot.topProducts).toEqual([
      { productId: 9, productName: "Carnet", quantitySold: 2 },
      { productId: 4, productName: "Affiche", quantitySold: 1 },
    ]);
  });

  it("rejects malformed amounts and ignores lines outside paid orders", () => {
    const snapshot = buildOwnerCommercialSnapshot({
      now: new Date("2026-10-04T12:00:00.000Z"),
      orders: [{ id: 1, totalAmount: -99, currencyCode: "CHF", paymentStatus: "paid", createdAt: "2026-10-04T10:00:00.000Z" }],
      lines: [
        { orderId: 1, productId: 2, productName: "Carte", quantity: 0 },
        { orderId: 99, productId: 3, productName: "Ignore", quantity: 4 },
      ],
    });
    expect(snapshot.buckets[0]).toMatchObject({ paidRevenueCents: 0, averageBasketCents: 0 });
    expect(snapshot.topProducts).toEqual([]);
  });
});
