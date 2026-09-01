import "dotenv/config";
import * as db from "../server/db";
import { buildDeliveryProfiles } from "./catalogLib";

const MUGS_CATEGORY_ID = 30003;
const MUG_IDS = [210001, 210002];
const DELETE_IDS = [180001, 90001, 60001]; // TEST CJ mug, étui maquillage (draft), organisateur câbles (draft)

async function main() {
  // 1) Move the two enriched mugs into the "Mugs" creations category.
  for (const id of MUG_IDS) {
    await db.replaceProductCategories(id, [MUGS_CATEGORY_ID]);
    console.log(`Mug #${id} -> catégorie Mugs (${MUGS_CATEGORY_ID})`);
    // 2) Give each mug delivery profiles for all 8 destinations (free shipping, included in price).
    await db.replaceProductDeliveryProfiles(id, buildDeliveryProfiles(null));
    console.log(`Mug #${id} -> 8 profils de livraison (CH, FR, DE, IT, AT, BE, NL, ES)`);
  }

  // 3) Remove leftover test/draft products.
  for (const id of DELETE_IDS) {
    const name = await db.getProductNameById(id);
    if (!name) { console.log(`#${id} déjà absent`); continue; }
    await db.deleteProduct(id);
    console.log(`Supprimé #${id} « ${name} »`);
  }

  console.log("fix_store terminé.");
  process.exit(0);
}
main().catch((e) => { console.error("FIX_STORE FAIL:", e); process.exit(1); });
