import "dotenv/config";
import mysql from "mysql2/promise";
async function main() {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
  const [rows]: any = await conn.query("SELECT id, name, supplier, supplierProductId, options FROM products WHERE id IN (210001,210002,150001,30006)");
  for (const r of rows) console.log(r.id, "| spid:", r.supplierProductId, "| options:", r.options);
  const [dp]: any = await conn.query("SELECT productId, countryCode, supplierShippingCost, customerShippingCost, deliveryMethod FROM productDeliveryProfiles WHERE productId IN (210001,210002)");
  console.log("=== delivery profiles ==="); console.log(JSON.stringify(dp, null, 2));
  await conn.end();
}
main().catch(e=>{console.error(e);process.exit(1);});
