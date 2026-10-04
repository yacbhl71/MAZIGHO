import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { decryptOwnerAiText, encryptOwnerAiText, type OwnerAiEncryptionPurpose } from "./ownerAiEncryption";

const purposes: OwnerAiEncryptionPurpose[] = ["mazigho-owner-knowledge", "mazigho-owner-ai-conversations", "mazigho-owner-ai-workspace", "mazigho-studio-project-desk"];

afterEach(() => vi.unstubAllEnvs());

describe("private owner AI encryption", () => {
  it.each(purposes)("encrypts and decrypts %s when production has only DATABASE_URL", purpose => {
    vi.stubEnv("JWT_SECRET", "");
    vi.stubEnv("OWNER_AI_ENCRYPTION_SECRET", "");
    vi.stubEnv("DATABASE_URL", "mysql://account:secret@db.example.test/mazigho");
    const encrypted = encryptOwnerAiText(purpose, "Contenu privé", "KEY_MISSING");
    expect(encrypted.ciphertext).not.toContain("Contenu privé");
    expect(decryptOwnerAiText(purpose, encrypted.ciphertext, encrypted.iv, "KEY_MISSING", "UNREADABLE")).toBe("Contenu privé");
    expect(() => decryptOwnerAiText(purpose, encrypted.ciphertext, encrypted.iv, "KEY_MISSING", "UNREADABLE")).not.toThrow();
  });

  it("continues reading legacy JWT-secret ciphertext after a dedicated secret is introduced", () => {
    const purpose: OwnerAiEncryptionPurpose = "mazigho-owner-ai-workspace";
    vi.stubEnv("JWT_SECRET", "previous-session-secret");
    vi.stubEnv("DATABASE_URL", "mysql://account:secret@db.example.test/mazigho");
    vi.stubEnv("OWNER_AI_ENCRYPTION_SECRET", "");
    const old = encryptOwnerAiText(purpose, "Archive précédente", "KEY_MISSING");
    vi.stubEnv("OWNER_AI_ENCRYPTION_SECRET", "new-dedicated-secret");
    expect(decryptOwnerAiText(purpose, old.ciphertext, old.iv, "KEY_MISSING", "UNREADABLE")).toBe("Archive précédente");
    const current = encryptOwnerAiText(purpose, "Archive actuelle", "KEY_MISSING");
    expect(current.ciphertext).not.toBe(old.ciphertext);
    expect(decryptOwnerAiText(purpose, current.ciphertext, current.iv, "KEY_MISSING", "UNREADABLE")).toBe("Archive actuelle");
  });

  it("reads an earlier JWT encrypted record with the original domain separator", () => {
    const purpose: OwnerAiEncryptionPurpose = "mazigho-owner-ai-conversations";
    vi.stubEnv("JWT_SECRET", "previous-session-secret");
    vi.stubEnv("OWNER_AI_ENCRYPTION_SECRET", "dedicated-secret");
    const iv = randomBytes(12);
    const key = createHash("sha256").update(`${purpose}:v1:previous-session-secret`).digest();
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update("Ancienne discussion", "utf8"), cipher.final(), cipher.getAuthTag()]);
    expect(decryptOwnerAiText(purpose, encrypted.toString("base64"), iv.toString("base64"), "KEY_MISSING", "UNREADABLE")).toBe("Ancienne discussion");
  });

  it("rejects a modified ciphertext without returning plaintext", () => {
    vi.stubEnv("JWT_SECRET", "session-secret");
    vi.stubEnv("OWNER_AI_ENCRYPTION_SECRET", "");
    const encrypted = encryptOwnerAiText("mazigho-owner-ai-workspace", "Secret", "KEY_MISSING");
    const changed = Buffer.from(encrypted.ciphertext, "base64");
    changed[0] ^= 1;
    expect(() => decryptOwnerAiText("mazigho-owner-ai-workspace", changed.toString("base64"), encrypted.iv, "KEY_MISSING", "UNREADABLE")).toThrow("UNREADABLE");
  });
});
