import "dotenv/config";
import mysql from "mysql2/promise";
(async () => {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
  const [rows]: any = await conn.query("SELECT id, name, price, supplierPrice, stock, options, LEFT(longDescription,80) AS ld FROM products WHERE id IN (240001,240002,240003)");
  for (const r of rows) { console.log("#"+r.id, "|", r.name); console.log("   price", r.price, "cost", r.supplierPrice, "stock", r.stock, "| options:", r.options); }
  const [imgs]: any = await conn.query("SELECT productId, COUNT(*) n FROM productImages WHERE productId IN (240001,240002,240003) GROUP BY productId");
  console.log("images:", JSON.stringify(imgs));
  const [dp]: any = await conn.query("SELECT productId, COUNT(*) n FROM productDeliveryProfiles WHERE productId IN (240001,240002,240003) GROUP BY productId");
  console.log("delivery profiles:", JSON.stringify(dp));
  await conn.end();
})();
