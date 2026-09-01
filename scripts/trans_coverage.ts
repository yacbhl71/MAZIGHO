import "dotenv/config";
import mysql from "mysql2/promise";
(async () => {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
  const [rows]: any = await conn.query(`
    SELECT p.id, p.name,
      (SELECT COUNT(*) FROM productTranslations t WHERE t.productId=p.id AND t.status='ready' AND t.locale IN ('de','it','en','es','nl','ar')) AS ready
    FROM products p WHERE p.status='active' ORDER BY ready ASC, p.id`);
  const full = rows.filter((r:any)=>r.ready>=6).length;
  const none = rows.filter((r:any)=>r.ready===0).length;
  const partial = rows.filter((r:any)=>r.ready>0 && r.ready<6).length;
  console.log(`TOTAL actifs: ${rows.length} | 6/6: ${full} | partiels: ${partial} | 0/6: ${none}`);
  console.log("--- incomplets ---");
  for (const r of rows.filter((r:any)=>r.ready<6)) console.log(`  #${r.id} ${r.ready}/6 — ${r.name.slice(0,50)}`);
  await conn.end();
})();
