import "dotenv/config";
import mysql from "mysql2/promise";
(async () => {
  const c = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
  const [rows]: any = await c.query("SELECT id, productId, authorName, userId, rating, status, LEFT(COALESCE(comment,''),40) c FROM reviews ORDER BY id DESC");
  console.log(JSON.stringify(rows, null, 2));
  await c.end();
})();
