import { describe, expect, it } from "vitest";
import { makeOwnerCatalogueCsvExport, makeOwnerOrdersCsvExport, makeOwnerStockCsvExport } from "./ownerCsvExport";

describe("owner CSV export projections", () => {
  it("creates a BOM UTF-8 catalogue CSV with only the allowed fields", () => {
    const result = makeOwnerCatalogueCsvExport("atelier-client", [{
      reference: "P-12",
      name: "Kit créatif",
      slug: "kit-creatif",
      category: "Loisirs",
      status: "active",
      priceCents: 2490,
      stock: 8,
      featured: true,
      updatedAt: "2026-09-26T08:00:00.000Z",
    }], new Date("2026-09-26T12:00:00.000Z"));

    expect(result.fileName).toBe("atelier-client-catalogue-2026-09-26.csv");
    expect(result.content.startsWith("\uFEFF")).toBe(true);
    expect(result.content).toContain('"Référence produit"');
    expect(result.content).toContain('"Kit créatif"');
    expect(result.content).not.toContain("supplier");
    expect(result.content).not.toContain("client@example.test");
  });

  it("keeps the stock sheet free of supplier and customer details", () => {
    const result = makeOwnerStockCsvExport("atelier-client", [{
      reference: "P-12",
      productName: "Kit créatif",
      productStatus: "active",
      productStock: 8,
      variantLabel: "Violet · M",
      sku: "KIT-V-M",
      variantStock: 3,
      variantStatus: "active",
      updatedAt: "2026-09-26T08:00:00.000Z",
    }]);

    expect(result.columns).toContain("SKU interne");
    expect(result.content).toContain('"KIT-V-M"');
    expect(result.content).not.toContain("supplier");
  });

  it("excludes payment, address and price facts from the operational order sheet", () => {
    const result = makeOwnerOrdersCsvExport("atelier-client", [{
      reference: "C-42",
      status: "processing",
      fulfillmentState: "shipped",
      productName: "Kit créatif",
      selectedOptions: JSON.stringify([{ name: "Couleur", value: "Violet" }]),
      quantity: 2,
      createdAt: "2026-09-26T08:00:00.000Z",
      updatedAt: "2026-09-26T09:00:00.000Z",
    }]);

    expect(result.content).toContain('"C-42"');
    expect(result.content).toContain('"Couleur: Violet"');
    expect(result.columns).not.toContain("Adresse");
    expect(result.columns).not.toContain("Paiement");
    expect(result.columns).not.toContain("Montant");
    expect(result.columns).not.toContain("Numéro de suivi");
    expect(result.content).not.toContain("2490");
  });
});
