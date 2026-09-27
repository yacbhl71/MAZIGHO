import { describe, expect, it } from "vitest";
import { buildCheckoutStockReservations, buildStoredOrderStockReservations } from "./checkoutStockReservation";

describe("checkout stock reservation policy", () => {
  it("groups product and selected-variant quantities independently", () => {
    expect(buildCheckoutStockReservations([
      { productId: 5, quantity: 1, supplierSnapshot: { ownerVariant: { id: 9 } } },
      { productId: 5, quantity: 2, supplierSnapshot: { ownerVariant: { id: 9 } } },
      { productId: 5, quantity: 3, supplierSnapshot: { ownerVariant: { id: 10 } } },
      { productId: 6, quantity: 1, supplierSnapshot: {} },
    ])).toEqual([
      { productId: 5, variantId: 9, quantity: 3 },
      { productId: 5, variantId: 10, quantity: 3 },
      { productId: 6, variantId: null, quantity: 1 },
    ]);
  });

  it("releases only explicitly marked stored reservations", () => {
    expect(buildStoredOrderStockReservations([
      { productId: 7, quantity: 1, supplierSnapshot: JSON.stringify({ inventoryReservation: true, ownerVariant: { id: 2 } }) },
      { productId: 8, quantity: 2, supplierSnapshot: "{not-json" },
      { productId: 9, quantity: 2, supplierSnapshot: JSON.stringify({ ownerVariant: { id: 3 } }) },
    ])).toEqual([{ productId: 7, variantId: 2, quantity: 1 }]);
  });

  it("rejects invalid quantities before inventory can be touched", () => {
    expect(() => buildCheckoutStockReservations([{ productId: 8, quantity: 0 }])).toThrow("CHECKOUT_STOCK_RESERVATION_INVALID");
  });
});
