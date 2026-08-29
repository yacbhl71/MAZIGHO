import "dotenv/config";
import mysql from "mysql2/promise";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const KEY_LENGTH = 64;
const VERSION = "scrypt-v1";

async function hashPassword(password) {
  const salt = randomBytes(16);
  const dk = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH);
  return [VERSION, salt.toString("base64url"), dk.toString("base64url")].join("$");
}

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  const url = process.env.DATABASE_URL;
  const pool = mysql.createPool({ uri: url, ssl: { rejectUnauthorized: false }, connectionLimit: 1 });
  const hash = await hashPassword(newPassword);
  const [res] = await pool.query(
    "UPDATE `users` SET `passwordHash` = ?, `loginMethod` = 'password', `accountStatus` = 'active', `role` = 'admin' WHERE LOWER(`email`) = ?",
    [hash, email.trim().toLowerCase()]
  );
  console.log("Rows affected:", res.affectedRows);
  const [rows] = await pool.query("SELECT id, email, role, accountStatus, loginMethod FROM `users` WHERE LOWER(`email`) = ?", [email.trim().toLowerCase()]);
  console.log("User now:", JSON.stringify(rows[0]));
  await pool.end();
}
main().catch(e => { console.error("ERR", e.message); process.exit(1); });
