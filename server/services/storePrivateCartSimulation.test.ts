import { describe, expect, it } from "vitest";
import { buildStudioPrivateCartSimulation } from "./storePrivateCartSimulation";

describe("buildStudioPrivateCartSimulation", () => {
  const products = [
    { id: "product-1", name: "Laisse de démonstration", description: "Fiche privée.", collectionId: "collection-1", priceCents: 1990, featured: true },
    { id: "product-2", name: "Gamelle de démonstration", description: "Fiche privée.", collectionId: "collection-1", priceCents: 1290, featured: false },
  ];
  const collections = [{ id: "collection-1", title: "Promenade" }];

  it("calcule un total de préparation sans créer de panier, client, paiement ou commande", () => {
    const result = buildStudioPrivateCartSimulation({
      products,
      collections,
      operations: [
        { productId: "product-1", stockState: "in_stock", stockQuantity: 3, supplierName: "", supplierReference: "" },
        { productId: "product-2", stockState: "limited", stockQuantity: 1, supplierName: "", supplierReference: "" },
      ],
      lines: [{ productId: "product-1", quantity: 2 }, { productId: "product-2", quantity: 1 }],
    });

    expect(result.privateCartSimulation).toBe(true);
    expect(result.publicStorefront).toBe(false);
    expect(result.persistedCart).toBe(false);
    expect(result.customerCreated).toBe(false);
    expect(result.checkoutAvailable).toBe(false);
    expect(result.paymentAvailable).toBe(false);
    expect(result.orderCreated).toBe(false);
    expect(result.supplierActionAvailable).toBe(false);
    expect(result.itemCount).toBe(3);
    expect(result.subtotalCents).toBe(5270);
  });

  it("refuse les fiches sans disponibilité préparée et ajuste une quantité au maximum disponible", () => {
    const result = buildStudioPrivateCartSimulation({
      products,
      collections,
      operations: [
        { productId: "product-1", stockState: "limited", stockQuantity: 2, supplierName: "Référence privée", supplierReference: "INTERNE-1" },
        { productId: "product-2", stockState: "to_confirm", stockQuantity: 0, supplierName: "", supplierReference: "" },
      ],
      lines: [{ productId: "product-1", quantity: 5 }, { productId: "product-2", quantity: 1 }],
    });

    expect(result.lines).toEqual(expect.arrayContaining([
      expect.objectContaining({ productId: "product-1", requestedQuantity: 5, acceptedQuantity: 2, lineTotalCents: 3980, status: "limited" }),
      expect.objectContaining({ productId: "product-2", acceptedQuantity: 0, lineTotalCents: 0, status: "unavailable" }),
    ]));
    expect(result.subtotalCents).toBe(3980);
    expect(result.unavailableLineCount).toBe(1);
    expect(JSON.stringify(result)).not.toContain("Référence privée");
    expect(JSON.stringify(result)).not.toContain("INTERNE-1");
  });
});
