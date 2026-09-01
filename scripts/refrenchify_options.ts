import "dotenv/config";
import mysql from "mysql2/promise";
import { frenchifyValue } from "./catalogLib";
(async () => {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
  const [rows]: any = await conn.query("SELECT id, options FROM products WHERE options IS NOT NULL AND options <> ''");
  let changed = 0;
  for (const r of rows) {
    let opts: any;
    try { opts = JSON.parse(r.options); } catch { continue; }
    if (!Array.isArray(opts)) continue;
    const next = opts.map((g: any) => ({ name: g.name, values: Array.from(new Set((g.values || []).map((v: string) => frenchifyValue(v)))) }));
    const before = JSON.stringify(opts), after = JSON.stringify(next);
    if (before !== after) {
      await conn.query("UPDATE products SET options=? WHERE id=?", [after, r.id]);
      changed++;
      console.log(`#${r.id} updated`);
    }
  }
  console.log(`Refrenchify terminé — ${changed} produit(s) mis à jour.`);
  await conn.end();
})();
