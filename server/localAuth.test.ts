import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./localAuth";

describe("local password authentication", () => {
  it("hashes a password without retaining it in clear text", async () => {
    const password = "MotDePasseRobuste!2026";
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^scrypt-v1\$/);
    expect(hash).not.toContain(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password and malformed hashes", async () => {
    const hash = await hashPassword("MotDePasseRobuste!2026");

    await expect(verifyPassword("MauvaisMotDePasse!2026", hash)).resolves.toBe(false);
    await expect(verifyPassword("MotDePasseRobuste!2026", "invalid")).resolves.toBe(false);
  });
});
