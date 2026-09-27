import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

// Manual migrations added after the original Drizzle journal are versioned here
// so Vercel can apply them before the server bundle is deployed. The runner is
// deliberately part of the build, never a storefront request path.
const migrations = [
  ["0028_stripe_connect_direct_charges", "drizzle/0028_stripe_connect_direct_charges.sql"],
  ["0029_lemon_squeezy_saas_billing", "drizzle/0029_lemon_squeezy_saas_billing.sql"],
  ["0030_controlled_return_requests", "drizzle/0030_controlled_return_requests.sql"],
  ["0031_stripe_connect_live_direct_charges", "drizzle/0031_stripe_connect_live_direct_charges.sql"],
];

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.log("[schema-migrations] DATABASE_URL absent : aucune migration appliquée.");
  process.exit(0);
}

const connection = await mysql.createConnection({
  uri: databaseUrl,
  ssl: { rejectUnauthorized: false },
  multipleStatements: true,
});

try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`mazighoSchemaMigrations\` (
      \`id\` varchar(120) NOT NULL PRIMARY KEY,
      \`appliedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const [id, relativePath] of migrations) {
    const [existing] = await connection.query("SELECT id FROM mazighoSchemaMigrations WHERE id = ? LIMIT 1", [id]);
    if (Array.isArray(existing) && existing.length > 0) {
      console.log(`[schema-migrations] ${id} déjà appliquée.`);
      continue;
    }

    const sql = await readFile(resolve(process.cwd(), relativePath), "utf8");
    await connection.query(sql);
    await connection.query("INSERT INTO mazighoSchemaMigrations (id) VALUES (?) ON DUPLICATE KEY UPDATE id = VALUES(id)", [id]);
    console.log(`[schema-migrations] ${id} appliquée.`);
  }
} finally {
  await connection.end();
}
