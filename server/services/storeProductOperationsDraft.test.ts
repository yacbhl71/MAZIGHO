import { describe, expect, it } from "vitest";
import { normalizeStudioProductOperationDrafts } from "./storeProductOperationsDraft";

const products = [{ id: "product-1", name: "Laisse urbaine" }];

describe("normalizeStudioProductOperationDrafts", () => {
  it("keeps only stock state, quantity and non-sensitive supplier references", () => {
    const result = normalizeStudioProductOperationDrafts([
      {
        productId: "product-1",
        stockState: "limited",
        stockQuantity: 7,
        supplierName: "Fournisseur de démonstration",
        supplierReference: "REF-LEASH-7",
        supplierUrl: "https://supplier.invalid/private",
        supplierCostCents: 600,
        apiKey: "secret",
        contactEmail: "supplier@example.test",
        purchaseNow: true,
      },
    ], products);

    expect(result).toEqual([{
      productId: "product-1",
      stockState: "limited",
      stockQuantity: 7,
      supplierName: "Fournisseur de démonstration",
      supplierReference: "REF-LEASH-7",
    }]);
  });

  it("keeps a closed default for each prepared product", () => {
    expect(normalizeStudioProductOperationDrafts([], products)).toEqual([{
      productId: "product-1",
      stockState: "to_confirm",
      stockQuantity: 0,
      supplierName: "",
      supplierReference: "",
    }]);
    expect(normalizeStudioProductOperationDrafts([{ productId: "unknown", stockState: "in_stock", stockQuantity: 50 }], products)).toEqual([{
      productId: "product-1",
      stockState: "to_confirm",
      stockQuantity: 0,
      supplierName: "",
      supplierReference: "",
    }]);
  });
});
