import { describe, expect, it } from "vitest";
import { buildCjVariantStoreData } from "./cjDropshipping";

describe("buildCjVariantStoreData", () => {
  it("expose des groupes de taille et couleur sans exposer les VID", () => {
    const result = buildCjVariantStoreData([
      { id: "CJ-RED-S", selectedOptions: { Couleur: "Rouge", Taille: "S" } },
      { id: "CJ-RED-M", selectedOptions: { Couleur: "Rouge", Taille: "M" } },
      { id: "CJ-BLUE-M", selectedOptions: { Couleur: "Bleu", Taille: "M" } },
    ]);

    expect(result.options).not.toContain("CJ-RED-S");
    expect(JSON.parse(result.options || "[]")).toEqual([
      {
        name: "Couleur",
        values: ["Rouge", "Bleu"],
        combinations: [
          { Couleur: "Rouge", Taille: "S" },
          { Couleur: "Rouge", Taille: "M" },
          { Couleur: "Bleu", Taille: "M" },
        ],
      },
      { name: "Taille", values: ["S", "M"] },
    ]);
    expect(JSON.parse(result.mappings || "{}").mappings).toEqual([
      { supplierVariantId: "CJ-RED-S", selectedOptions: { Couleur: "Rouge", Taille: "S" } },
      { supplierVariantId: "CJ-RED-M", selectedOptions: { Couleur: "Rouge", Taille: "M" } },
      { supplierVariantId: "CJ-BLUE-M", selectedOptions: { Couleur: "Bleu", Taille: "M" } },
    ]);
  });

  it("préserve des valeurs CJ non structurées sous un choix générique", () => {
    const result = buildCjVariantStoreData([
      { id: "CJ-DIVIDER-56", selectedOptions: { Option: "Photo Color-56x6x1.5cm" } },
      { id: "CJ-DIVIDER-43", selectedOptions: { Option: "Photo Color-43x6x1.5cm" } },
    ]);

    expect(JSON.parse(result.options || "[]")).toEqual([
      {
        name: "Option",
        values: ["Photo Color-56x6x1.5cm", "Photo Color-43x6x1.5cm"],
        combinations: [
          { Option: "Photo Color-56x6x1.5cm" },
          { Option: "Photo Color-43x6x1.5cm" },
        ],
      },
    ]);
    expect(result.options).not.toContain("CJ-DIVIDER-56");
    expect(JSON.parse(result.mappings || "{}").mappings).toHaveLength(2);
  });

  it("n’ajoute aucune option lorsqu’une combinaison CJ ne peut pas être interprétée", () => {
    const result = buildCjVariantStoreData([{ id: "CJ-SIMPLE", selectedOptions: {} }]);
    expect(result).toEqual({ options: null, mappings: null });
  });
});
