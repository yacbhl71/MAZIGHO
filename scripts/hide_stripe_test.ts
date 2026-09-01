import "dotenv/config";
import mysql from "mysql2/promise";
(async () => {
  const c = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
  const [r]: any = await c.query("UPDATE products SET status='draft' WHERE name LIKE '%test Stripe%' OR name LIKE '%ne pas vendre%'");
  console.log("hidden (draft):", r.affectedRows);
  const [rows]: any = await c.query("SELECT id, name, status FROM products WHERE name LIKE '%Stripe%' OR name LIKE '%ne pas vendre%'");
  console.log(JSON.stringify(rows));
  await c.end();
})();
