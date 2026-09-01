import "dotenv/config";
import mysql from "mysql2/promise";
import * as db from "../server/db";
import { searchCjCatalog, prepareCjProductImport } from "../server/cjDropshipping";
import { priceFromSupplierUsd, buildDeliveryProfiles, buildOptionsFromVariants, generateSalesCopyFr, slugify, sleep } from "./catalogLib";

type Cat = { id: number; name: string; keywords: string[]; featured?: boolean };

const CATEGORIES: Cat[] = [
  { id: 1, name: "High-Tech & Gadgets", keywords: ["phone holder stand", "wireless charger", "led night light", "bluetooth speaker mini"], featured: true },
  { id: 2, name: "Maison & Organisation", keywords: ["kitchen storage organizer", "drawer organizer box", "spice rack holder", "closet storage"], featured: true },
  { id: 3, name: "Beauté & Bien-Être", keywords: ["facial massager roller", "makeup brush set", "hair clip set", "gua sha tool"], featured: true },
  { id: 4, name: "Sport & Fitness", keywords: ["resistance bands set", "yoga mat", "jump rope", "fitness gloves"], featured: true },
  { id: 5, name: "Auto & Accessoires", keywords: ["car phone holder mount", "car trunk organizer", "car cleaning brush", "car seat gap organizer"], featured: true },
  { id: 6, name: "Mode", keywords: ["women scarf winter", "sunglasses unisex", "jewelry necklace set", "leather belt"], featured: true },
  { id: 30001, name: "T-shirts", keywords: ["cotton t-shirt unisex plain", "graphic t-shirt", "summer t-shirt cotton"] },
  { id: 30002, name: "Sweats", keywords: ["hoodie unisex", "sweatshirt pullover", "fleece hoodie"] },
  { id: 30003, name: "Mugs", keywords: ["ceramic coffee mug", "travel mug", "color changing mug"] },
  { id: 30004, name: "Affiches", keywords: ["wall art poster print", "canvas art print", "decorative poster"] },
  { id: 30005, name: "Tote bags", keywords: ["canvas tote bag", "cotton shopping bag", "shoulder tote bag"] },
];

const TARGET = Number(process.env.TARGET || 5);

async function countActivePerCategory() {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
  const [rows]: any = await conn.query(
    "SELECT pc.categoryId AS categoryId, COUNT(DISTINCT p.id) AS n FROM productCategories pc JOIN products p ON p.id = pc.productId AND p.status = 'active' GROUP BY pc.categoryId"
  );
  await conn.end();
  const map = new Map<number, number>();
  for (const r of rows) map.set(Number(r.categoryId), Number(r.n));
  return map;
}

async function processCategory(cat: Cat, existing: number) {
  let need = Math.max(0, TARGET - existing);
  console.log(`\n=== [${cat.id}] ${cat.name} — existants actifs: ${existing}, à ajouter: ${need} ===`);
  if (need === 0) return 0;

  let added = 0;
  const seenIds = new Set<string>();

  for (const keyword of cat.keywords) {
    if (need === 0) break;
    let search;
    try {
      search = await searchCjCatalog({ keyword, page: 1 });
    } catch (e) {
      console.log(`  recherche "${keyword}" échouée: ${e instanceof Error ? e.message : e}`);
      await sleep(1500);
      continue;
    }
    console.log(`  recherche "${keyword}": ${search.products.length} résultats`);
    for (const candidate of search.products) {
      if (need === 0) break;
      if (!candidate.id || seenIds.has(candidate.id) || !candidate.imageUrl) continue;
      seenIds.add(candidate.id);

      const existingRef = await db.getProductBySupplierReference("CJdropshipping", candidate.id);
      if (existingRef) continue;

      const usdGuess = candidate.supplierPriceUsd;
      if (usdGuess != null && (usdGuess < 0.4 || usdGuess > 60)) continue;

      await sleep(800);
      let prepared;
      try {
        prepared = await prepareCjProductImport({ productId: candidate.id, productSku: candidate.sku || undefined });
      } catch (e) {
        console.log(`    prepare ${candidate.id} échoué: ${e instanceof Error ? e.message : e}`);
        continue;
      }

      const supplierUsd = prepared.supplierPriceUsd ?? usdGuess;
      if (supplierUsd == null || supplierUsd <= 0 || supplierUsd > 60) { console.log(`    prix fournisseur invalide (${supplierUsd}), ignoré`); continue; }
      const images = prepared.images.length ? prepared.images : (candidate.imageUrl ? [candidate.imageUrl] : []);
      if (images.length === 0) continue;

      const { priceCents, supplierPriceCents } = priceFromSupplierUsd(supplierUsd);
      const options = buildOptionsFromVariants(prepared.variants);
      const supplierVariantId = prepared.variants[0]?.id || null;

      const copy = await generateSalesCopyFr({
        cjName: prepared.name,
        category: cat.name,
        cjDescription: prepared.description,
        variantsLabel: prepared.variantsLabel,
        attributes: prepared.logisticsProperties,
      });

      const slug = `${slugify(copy.name)}-${candidate.id.slice(-6)}`;
      try {
        const created: any = await db.createProduct({
          categoryId: cat.id,
          name: copy.name,
          slug,
          description: copy.description || null,
          longDescription: copy.longDescription || null,
          price: priceCents,
          originalPrice: null,
          stock: 60,
          featured: cat.featured && added === 0 ? 1 : 0,
          status: "active" as const,
          images,
          options: options.length ? JSON.stringify(options) : undefined,
          supplier: "CJdropshipping",
          supplierProductId: candidate.id,
          supplierPrice: supplierPriceCents,
          categoryIds: [cat.id],
          deliveryProfiles: buildDeliveryProfiles(supplierVariantId),
          lastSyncedAt: new Date(),
        });
        added++;
        need--;
        console.log(`    ✔ #${created?.id} « ${copy.name} » — ${(priceCents / 100).toFixed(2)} CHF (coût ${(supplierPriceCents / 100).toFixed(2)}), ${options.length} groupe(s) variante`);
      } catch (e) {
        console.log(`    création échouée (${copy.name}): ${e instanceof Error ? e.message : e}`);
      }
    }
    await sleep(1200);
  }
  console.log(`  => ${cat.name}: ${added} ajouté(s)`);
  return added;
}

async function main() {
  const only = process.argv.slice(2).map((x) => Number(x)).filter((x) => Number.isFinite(x));
  const targets = only.length ? CATEGORIES.filter((c) => only.includes(c.id)) : CATEGORIES;
  const counts = await countActivePerCategory();
  let total = 0;
  for (const cat of targets) {
    const added = await processCategory(cat, counts.get(cat.id) || 0);
    total += added;
  }
  console.log(`\n=== POPULATION TERMINÉE — ${total} produits ajoutés ===`);
  process.exit(0);
}
main().catch((e) => { console.error("POPULATE FAIL:", e); process.exit(1); });
