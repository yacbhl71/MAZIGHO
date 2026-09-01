import "dotenv/config";
import { translateProductFromFrench } from "../server/productTranslation";

async function main() {
  const productId = Number(process.argv[2] || 210001);
  const locales = (process.argv[3] || "de,it,en,es,nl,ar").split(",") as any;
  console.log(`Translating product ${productId} -> ${locales.join(", ")}`);
  const t0 = Date.now();
  const saved = await translateProductFromFrench(productId, locales);
  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s. Saved ${saved.length} translations.`);
  for (const s of saved) console.log(`  [${s.locale}] ${s.name}`);
  process.exit(0);
}
main().catch((e) => { console.error("TRANSLATE FAIL:", e instanceof Error ? e.message : e); process.exit(1); });
