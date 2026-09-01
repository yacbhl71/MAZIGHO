import "dotenv/config";
import mysql from "mysql2/promise";
(async () => {
  const c = await mysql.createConnection({ uri: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: true } });
  const [r]: any = await c.query("DELETE FROM reviews WHERE authorName IN ('Sophie QA','Marc T. QA','Amine QA')");
  console.log("deleted:", r.affectedRows);
  const [cnt]: any = await c.query("SELECT COUNT(*) n FROM reviews");
  console.log("remaining:", cnt[0].n);
  await c.end();
})();
