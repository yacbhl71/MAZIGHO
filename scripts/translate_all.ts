import "dotenv/config";
import mysql from "mysql2/promise";
import { translateProductFromFrench } from "../server/productTranslation";

const LOCALES = ["de", "it", "en", "es", "nl", "ar"] as const;
const CONCURRENCY = 3;

async function main() {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
  const [prods]: any = await conn.query("SELECT id, name FROM products WHERE status='active' ORDER BY id");
  const [trans]: any = await conn.query("SELECT productId, locale FROM productTranslations WHERE status='ready'");
  await conn.end();

  const ready = new Map<number, Set<string>>();
  for (const t of trans) {
    if (!ready.has(t.productId)) ready.set(t.productId, new Set());
    ready.get(t.productId)!.add(t.locale);
  }

  const jobs = prods
    .map((p: any) => ({ id: p.id, name: p.name, missing: LOCALES.filter((l) => !(ready.get(p.id)?.has(l))) }))
    .filter((j: any) => j.missing.length > 0);

  console.log(`Produits actifs: ${prods.length} | à traduire (au moins 1 langue manquante): ${jobs.length}`);

  let done = 0, failed = 0;
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (job: any) => {
      try {
        const t0 = Date.now();
        const saved = await translateProductFromFrench(job.id, job.missing as any);
        done++;
        console.log(`  ✔ #${job.id} (${job.missing.join(",")}) ${saved.length} langues en ${((Date.now() - t0) / 1000).toFixed(1)}s — « ${job.name.slice(0, 50)} »`);
      } catch (e) {
        failed++;
        console.log(`  ✖ #${job.id} échec: ${e instanceof Error ? e.message : e}`);
      }
    }));
    console.log(`  … progression ${Math.min(i + CONCURRENCY, jobs.length)}/${jobs.length}`);
  }
  console.log(`\n=== TRADUCTIONS TERMINÉES — ${done} ok, ${failed} échecs ===`);
  process.exit(0);
}
main().catch((e) => { console.error("TRANSLATE_ALL FAIL:", e); process.exit(1); });
