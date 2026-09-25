import { describe, expect, it } from "vitest";
import { summarizeOwnerOrderItems } from "./ownerOrderItems";

describe("owner order item presentation", () => {
  it("keeps only product snapshots, quantities and safe option labels", () => {
    const result = summarizeOwnerOrderItems([{
      id: 4,
      quantity: 2,
      productNameSnapshot: "Kit créatif violet",
      productName: "Nom catalogue actuel",
      selectedOptions: JSON.stringify({ Couleur: "Fuchsia", "Variante choisie": "Grand format" }),
    }]);

    expect(result).toEqual([{
      id: 4,
      quantity: 2,
      productName: "Kit créatif violet",
      selectedOptions: [
        { name: "Couleur", value: "Fuchsia" },
        { name: "Variante choisie", value: "Grand format" },
      ],
    }]);
    expect(JSON.stringify(result)).not.toContain("supplier");
    expect(JSON.stringify(result)).not.toContain("address");
  });

  it("does not surface malformed or non-string option data", () => {
    const result = summarizeOwnerOrderItems([
      { id: 5, quantity: 0, productNameSnapshot: null, productName: null, selectedOptions: "not-json" },
      { id: 6, quantity: 1, productNameSnapshot: "Produit", productName: null, selectedOptions: JSON.stringify({ Taille: 42, Couleur: " " }) },
    ]);

    expect(result).toEqual([
      { id: 5, quantity: 1, productName: "Article de la boutique", selectedOptions: [] },
      { id: 6, quantity: 1, productName: "Produit", selectedOptions: [] },
    ]);
  });
});
