import { describe, expect, it } from "vitest";
import { parseDraftCsvImport } from "../client/src/lib/draftCsvImport";

describe("parseDraftCsvImport", () => {
  it("reads an Excel-compatible CSV and preserves quoted descriptions", () => {
    const csv = [
      "\uFEFF\"SKU\",\"Titre_Brut_CJ\",\"Nouveau_Titre_Epure\",\"Accroche_SEO\",\"Description_Detaillee\",\"Prix_Vente_CHF\"",
      "\"MAZIGHO-42\",\"Titre CJ\",\"Titre épuré\",\"Accroche claire\",\"Description avec, une virgule\n et un retour\",\"19.90\"",
      "\"MAZIGHO-43\",\"Autre titre\",\"\",\"\",\"\",\"29.90\"",
    ].join("\r\n");

    expect(parseDraftCsvImport(csv)).toEqual({
      ignoredEmptyRows: 1,
      updates: [{
        sku: "MAZIGHO-42",
        name: "Titre épuré",
        description: "Accroche claire",
        longDescription: "Description avec, une virgule\n et un retour",
      }],
    });
  });

  it("refuses duplicate or malformed MAZIGHO SKU values", () => {
    const headers = "SKU,Nouveau_Titre_Epure,Accroche_SEO,Description_Detaillee";
    expect(() => parseDraftCsvImport(`${headers}\nMAZIGHO-7,Titre,,\nMAZIGHO-7,Autre,,`)).toThrow("apparaît plusieurs fois");
    expect(() => parseDraftCsvImport(`${headers}\nCJ-7,Titre,,`)).toThrow("n’est pas un SKU MAZIGHO valide");
  });
});
