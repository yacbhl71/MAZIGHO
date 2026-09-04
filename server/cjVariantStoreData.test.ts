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

  it("n’ajoute aucune option lorsqu’une combinaison CJ ne peut pas être interprétée", () => {
    const result = buildCjVariantStoreData([{ id: "CJ-SIMPLE", selectedOptions: {} }]);
    expect(result).toEqual({ options: null, mappings: null });
  });
});
