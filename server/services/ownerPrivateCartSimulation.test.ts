import { describe, expect, it } from "vitest";
import { buildOwnerPrivateCartSimulation } from "./ownerPrivateCartSimulation";

const products = [
  { id: 11, name: "T-shirt", description: "Coton", price: 2500, stock: 9, status: "active", featured: 1 },
  { id: 12, name: "Pull", description: "Laine", price: 4000, stock: 0, status: "active", featured: 0 },
];

const shippingPolicy = {
  mode: "flat_rate" as const,
  flatShippingRateCents: 650,
  freeShippingThresholdCents: 5000,
  servedCountries: ["CH"],
  countryServed: true,
  deliveryLeadTime: "2 à 4 jours",
  returnsSummary: "Retour sous 14 jours.",
};

const currency = { code: "CHF" as const, rateBps: 10_000 };

describe("owner private cart simulation", () => {
  it("calculates a scoped presentation total without cart, payment or order side effects", () => {
    const result = buildOwnerPrivateCartSimulation({
      products,
      variants: [{ id: 31, productId: 11, label: "Taille M", priceAdjustmentCents: 300, stock: 2 }],
      lines: [{ productId: 11, variantId: 31, quantity: 2 }],
      shippingPolicy,
      currency,
    });

    expect(result).toMatchObject({
      privateCartSimulation: true,
      persistedCart: false,
      customerCreated: false,
      checkoutAvailable: false,
      paymentAvailable: false,
      orderCreated: false,
      supplierActionAvailable: false,
      itemCount: 2,
      totals: { subtotalCents: 5600, shippingCents: 0, totalCents: 5600 },
    });
    expect(result.lines[0]).toMatchObject({ variantLabel: "Taille M", acceptedQuantity: 2, lineTotalCents: 5600 });
  });

  it("uses variant stock over product stock and rejects unavailable selections", () => {
    const result = buildOwnerPrivateCartSimulation({
      products,
      variants: [{ id: 32, productId: 11, label: "Taille S", priceAdjustmentCents: 0, stock: 1 }],
      lines: [{ productId: 11, variantId: 32, quantity: 4 }, { productId: 12, quantity: 1 }],
      shippingPolicy,
      currency,
    });

    expect(result.lines).toEqual(expect.arrayContaining([
      expect.objectContaining({ productId: 11, acceptedQuantity: 1, status: "limited" }),
      expect.objectContaining({ productId: 12, acceptedQuantity: 0, status: "unavailable" }),
    ]));
    expect(result.itemCount).toBe(1);
    expect(result.totals).toMatchObject({ subtotalCents: 2500, shippingCents: 650, totalCents: 3150 });
  });

  it("does not add a delivery charge for an unserved country", () => {
    const result = buildOwnerPrivateCartSimulation({
      products,
      variants: [],
      lines: [{ productId: 11, quantity: 1 }],
      shippingPolicy: { ...shippingPolicy, countryServed: false },
      currency,
    });

    expect(result.delivery.countryServed).toBe(false);
    expect(result.totals.shippingCents).toBe(0);
    expect(result.totals.totalCents).toBe(2500);
  });
});
