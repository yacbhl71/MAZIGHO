import "dotenv/config";
import mysql from "mysql2/promise";
(async () => {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
  const [rows]: any = await conn.query("SELECT id, name, options FROM products WHERE id IN (240031,240032,240026,240021,240016)");
  for (const r of rows) console.log(`#${r.id} ${r.name}\n   options: ${r.options}\n`);
  await conn.end();
})();
