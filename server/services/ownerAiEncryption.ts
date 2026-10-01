import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { ENV } from "../_core/env";

export type OwnerAiEncryptionPurpose = "mazigho-owner-knowledge" | "mazigho-owner-ai-conversations" | "mazigho-owner-ai-workspace";

/** A dedicated key is preferred. Existing JWT-key ciphertext remains readable;
 * older deployments without JWT_SECRET use a domain-separated database secret.
 * Never rotate/remove the sole remaining secret without re-encrypting existing data. */
function candidateKeys(purpose: OwnerAiEncryptionPurpose, missingCode: string) {
  const secrets = [
    process.env.OWNER_AI_ENCRYPTION_SECRET?.trim(),
    process.env.JWT_SECRET || ENV.cookieSecret,
    process.env.DATABASE_URL || ENV.databaseUrl,
  ].filter((value): value is string => Boolean(value));
  if (!secrets.length) throw new Error(missingCode);
  return Array.from(new Set(secrets)).map(secret => createHash("sha256").update(`${purpose}:v1:${secret}`).digest());
}

export function encryptOwnerAiText(purpose: OwnerAiEncryptionPurpose, value: string, missingCode: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", candidateKeys(purpose, missingCode)[0], iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final(), cipher.getAuthTag()]);
  return { ciphertext: encrypted.toString("base64"), iv: iv.toString("base64") };
}

export function decryptOwnerAiText(purpose: OwnerAiEncryptionPurpose, ciphertext: string, ivValue: string, missingCode: string, unreadableCode: string) {
  try {
    const data = Buffer.from(ciphertext, "base64");
    const iv = Buffer.from(ivValue, "base64");
    if (data.length < 17 || iv.length !== 12) throw new Error("INVALID_CIPHER");
    for (const key of candidateKeys(purpose, missingCode)) {
      try {
        const decipher = createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAuthTag(data.subarray(-16));
        return Buffer.concat([decipher.update(data.subarray(0, -16)), decipher.final()]).toString("utf8");
      } catch {
        // Authentication failed with this key; try the previous configured key.
      }
    }
  } catch {
    // Never reveal secret configuration or ciphertext to the caller.
  }
  throw new Error(unreadableCode);
}
