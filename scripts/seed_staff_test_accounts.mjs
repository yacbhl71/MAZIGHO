import "dotenv/config";
import mysql from "mysql2/promise";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
async function hashPassword(password) {
  const salt = randomBytes(16);
  const dk = await scrypt(password.normalize("NFKC"), salt, 64);
  return ["scrypt-v1", salt.toString("base64url"), dk.toString("base64url")].join("$");
}

async function main() {
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionLimit: 2 });
  // Ensure the role enum contains the staff roles used by RBAC
  await pool.query("ALTER TABLE `users` MODIFY `role` enum('user','catalog_editor','support_agent','order_operator','admin') NOT NULL DEFAULT 'user'");

  const accounts = [
    { name: "Test Éditeur Catalogue", email: "catalog@mazigho.test", password: "Catalog2026!", role: "catalog_editor" },
    { name: "Test Opérateur Commandes", email: "orders@mazigho.test", password: "Orders2026!", role: "order_operator" },
  ];
  for (const a of accounts) {
    const hash = await hashPassword(a.password);
    const email = a.email.toLowerCase();
    const openId = `local_test_${a.role}`;
    await pool.query(
      "INSERT INTO `users` (`openId`,`name`,`email`,`passwordHash`,`loginMethod`,`role`,`accountStatus`,`createdAt`,`updatedAt`) VALUES (?,?,?,?,'password',?,'active',NOW(),NOW()) ON DUPLICATE KEY UPDATE `passwordHash`=VALUES(`passwordHash`), `role`=VALUES(`role`), `accountStatus`='active', `loginMethod`='password'",
      [openId, a.name, email, hash, a.role]
    );
    console.log(`upserted ${email} (${a.role})`);
  }
  const [rows] = await pool.query("SELECT id, email, role, accountStatus FROM `users` WHERE email IN ('catalog@mazigho.test','orders@mazigho.test')");
  console.log(JSON.stringify(rows));
  await pool.end();
}
main().catch(e => { console.error("ERR", e.message); process.exit(1); });
