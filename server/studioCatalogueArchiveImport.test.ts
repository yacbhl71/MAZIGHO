import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { parseStudioCatalogueArchive } from "../client/src/lib/studioCatalogueArchiveImport";

function asUpload(name: string, bytes: Uint8Array) {
  return {
    name,
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  };
}

const catalogue = [
  "category,name,shortDescription,longDescription,price,stock,dimensions,imageUrl,featured",
  '"Affiches","Forêt violette","Illustration","Une affiche encadrée.",24.50,3,"30×40 cm","images/foret.webp",oui',
].join("\n");

describe("Studio universal archive import", () => {
  it("reads a MAZIGHO archive locally and detects its importable components", async () => {
    const archive = zipSync({
      "catalogue.csv": strToU8(catalogue),
      "variations.csv": strToU8("productName,label,sku,priceAdjustment,stock,status\nForêt violette,Cadre : chêne,FORET-CHENE,4,2,active"),
      "images/foret.webp": strToU8("webp-placeholder"),
      "contenus/a-propos.md": strToU8("# Notre histoire"),
      "marque/couleurs.json": strToU8('{"primary":"#000000"}'),
      "manifest.json": strToU8('{"source":"WooCommerce","currency":"EUR","language":"fr","rightsConfirmed":true,"catalogue":"catalogue.csv"}'),
    });

    const preview = await parseStudioCatalogueArchive(asUpload("essai.zip", archive));

    expect(preview.issues).toEqual([]);
    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0].localImagePaths).toEqual(["images/foret.webp"]);
    expect(preview.assets.map(asset => asset.path)).toEqual(["images/foret.webp"]);
    expect(preview.variants).toHaveLength(1);
    expect(preview.contentPaths).toEqual(["contenus/a-propos.md"]);
    expect(preview.brandPaths).toEqual(["marque/couleurs.json"]);
    expect(preview.manifest).toMatchObject({ source: "WooCommerce", currency: "EUR", rightsConfirmed: true });
  });

  it("refuses archives with unsafe traversal paths before importing anything", async () => {
    const archive = zipSync({
      "../catalogue.csv": strToU8(catalogue),
    });

    const preview = await parseStudioCatalogueArchive(asUpload("unsafe.zip", archive));

    expect(preview.rows).toEqual([]);
    expect(preview.issues[0]?.message).toContain("chemin de fichier non autorisé");
  });

  it("keeps a direct CSV compatible with the same universal contract", async () => {
    const preview = await parseStudioCatalogueArchive(asUpload("catalogue.csv", strToU8(catalogue)));

    expect(preview.sourceKind).toBe("csv");
    expect(preview.issues).toEqual([]);
    expect(preview.rows[0]).toMatchObject({ name: "Forêt violette", priceCents: 2450, localImagePaths: ["images/foret.webp"] });
    expect(preview.sourceBytes).toBeGreaterThan(0);
    expect(preview.declaredExtractedBytes).toBeGreaterThan(0);
  });

  it("guides a local WordPress conversion instead of attempting a direct import", async () => {
    const preview = await parseStudioCatalogueArchive(asUpload("sauvegarde.wpress", strToU8("wordpress-backup")));

    expect(preview.rows).toEqual([]);
    expect(preview.issues[0]?.message).toContain("Convertir un .wpress");
    expect(preview.sourceBytes).toBeGreaterThan(0);
  });

  it("detects an outer ZIP containing one WordPress backup before importing anything", async () => {
    const archive = zipSync({ "wordpress/sauvegarde.wpress": strToU8("wordpress-backup") });
    const preview = await parseStudioCatalogueArchive(asUpload("wordpress.zip", archive));

    expect(preview.rows).toEqual([]);
    expect(preview.issues[0]?.message).toContain("Convertir un .wpress");
    expect(preview.declaredExtractedBytes).toBeGreaterThan(0);
  });
});
