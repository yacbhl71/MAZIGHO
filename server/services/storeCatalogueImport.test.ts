import { describe, expect, it } from "vitest";
import { buildStoreCatalogueImportCsv, parseStoreCatalogueImportCsv, type StoreCatalogueImportRow } from "../../shared/storeCatalogueImport";

const validRow: StoreCatalogueImportRow = {
  category: "Diamond Painting",
  name: "Palais des cerisiers",
  shortDescription: "Une scène fleurie.",
  longDescription: "Une description complète du tableau créatif.",
  priceCents: 3990,
  stock: 10,
  dimensions: ["30×40 cm", "40×50 cm"],
  imageUrl: "https://images.example.test/palais.webp",
  featured: true,
};

describe("store catalogue CSV import", () => {
  it("round-trips valid products with dimensions, URLs and quoted text", () => {
    const csv = buildStoreCatalogueImportCsv([validRow]);
    const result = parseStoreCatalogueImportCsv(csv);

    expect(result.issues).toEqual([]);
    expect(result.rows).toEqual([validRow]);
  });

  it("reports malformed prices, insecure images and missing columns without creating hidden defaults", () => {
    const csv = [
      "category,name,shortDescription,longDescription,priceChf,stock,dimensions,imageUrl,featured",
      "Diamond Painting,Produit,Texte,Texte détaillé,gratuit,4,30×40 cm,http://example.test/image.webp,non",
    ].join("\n");
    const result = parseStoreCatalogueImportCsv(csv);

    expect(result.rows).toHaveLength(1);
    expect(result.issues.map(issue => issue.message)).toEqual(expect.arrayContaining([
      expect.stringContaining("prix CHF"),
      expect.stringContaining("https://"),
    ]));
  });

  it("accepts French boolean values and semicolon or pipe separated dimensions", () => {
    const csv = [
      "category,name,shortDescription,longDescription,priceChf,stock,dimensions,imageUrl,featured",
      '"Diamond Painting","Produit fleurs","Accroche","Description",36,10,"30×40 cm | 40×50 cm; 50×70 cm","https://images.example.test/fleurs.webp","oui"',
    ].join("\n");
    const result = parseStoreCatalogueImportCsv(csv);

    expect(result.issues).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      priceCents: 3600,
      featured: true,
      dimensions: ["30×40 cm", "40×50 cm", "50×70 cm"],
    });
  });
});
