import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const PASSWORD_HASH_VERSION = "scrypt-v1";

function normalisePassword(password: string): string {
  return password.normalize("NFKC");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(
    normalisePassword(password),
    salt,
    KEY_LENGTH
  )) as Buffer;

  return [
    PASSWORD_HASH_VERSION,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined
): Promise<boolean> {
  if (!storedHash) return false;

  const [version, saltEncoded, hashEncoded] = storedHash.split("$");
  if (
    version !== PASSWORD_HASH_VERSION ||
    !saltEncoded ||
    !hashEncoded ||
    storedHash.split("$").length !== 3
  ) {
    return false;
  }

  try {
    const salt = Buffer.from(saltEncoded, "base64url");
    const expected = Buffer.from(hashEncoded, "base64url");
    if (salt.length !== 16 || expected.length !== KEY_LENGTH) return false;

    const derivedKey = (await scrypt(
      normalisePassword(password),
      salt,
      KEY_LENGTH
    )) as Buffer;

    return timingSafeEqual(expected, derivedKey);
  } catch {
    return false;
  }
}
