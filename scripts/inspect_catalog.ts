import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const url = process.env.DATABASE_URL!;
  const conn = await mysql.createConnection({ uri: url, ssl: { rejectUnauthorized: true } });

  const [cats] = await conn.query(
    "SELECT c.id, c.name, c.slug, c.catalogSection, c.displayOrder, " +
    "(SELECT COUNT(*) FROM products p WHERE p.categoryId = c.id) AS primaryProducts " +
    "FROM categories c ORDER BY c.catalogSection, c.displayOrder, c.id"
  );
  console.log("=== CATEGORIES ===");
  console.log(JSON.stringify(cats, null, 2));

  const [prodCount] = await conn.query("SELECT status, COUNT(*) AS n FROM products GROUP BY status");
  console.log("=== PRODUCT COUNT BY STATUS ===");
  console.log(JSON.stringify(prodCount, null, 2));

  const [prods] = await conn.query(
    "SELECT id, categoryId, name, slug, price, supplier, supplierPrice, stock, status, " +
    "CHAR_LENGTH(COALESCE(options,'')) AS optionsLen, CHAR_LENGTH(COALESCE(longDescription,'')) AS longLen " +
    "FROM products ORDER BY id DESC LIMIT 30"
  );
  console.log("=== LAST PRODUCTS ===");
  console.log(JSON.stringify(prods, null, 2));

  const [pcMap] = await conn.query("SELECT COUNT(*) AS n FROM productCategories").catch(() => [[{ n: "TABLE_MISSING" }]]);
  console.log("=== productCategories mapping rows ===");
  console.log(JSON.stringify(pcMap, null, 2));

  const [trans] = await conn.query("SELECT locale, COUNT(*) AS n FROM productTranslations GROUP BY locale").catch(() => [[{ locale: "TABLE_MISSING", n: 0 }]]);
  console.log("=== productTranslations by locale ===");
  console.log(JSON.stringify(trans, null, 2));

  await conn.end();
}

main().catch(err => { console.error(err); process.exit(1); });
