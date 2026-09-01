import "dotenv/config";
import mysql from "mysql2/promise";
(async () => {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
  const [rows]: any = await conn.query("SELECT id, name, description, longDescription FROM products WHERE id=210001");
  console.log("NAME:", rows[0].name);
  console.log("SHORT:", rows[0].description);
  console.log("LONG:\n", rows[0].longDescription);
  const [imgs]: any = await conn.query("SELECT imageUrl FROM productImages WHERE productId=210001 ORDER BY displayOrder");
  console.log("IMAGES:", imgs.length, imgs.slice(0,2).map((i:any)=>i.imageUrl));
  await conn.end();
})();
