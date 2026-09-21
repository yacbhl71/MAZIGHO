import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  activateAccountFromInvitation: vi.fn(),
  createPasswordUser: vi.fn(),
  getFirstActiveOwnerStoreForUser: vi.fn(),
  getUserByEmail: vi.fn(async () => null),
  markUserSignedIn: vi.fn(),
  requestPasswordResetToken: vi.fn(),
  resetPasswordFromToken: vi.fn(),
  updatePasswordUser: vi.fn(),
}));

vi.mock("./localAuth", () => ({
  hashPassword: vi.fn(async () => "scrypt-v1$test"),
  verifyPassword: vi.fn(async () => false),
}));

vi.mock("./transactionalEmail", () => ({
  isTransactionalEmailConfigured: vi.fn(() => false),
  sendPasswordResetEmail: vi.fn(),
}));

import { authRouter } from "./authRouter";
import { resetAuthRateLimitForTests } from "./authRateLimit";

function caller() {
  return authRouter.createCaller({
    user: null,
    store: null,
    req: { ip: "203.0.113.55", headers: {}, socket: { remoteAddress: "203.0.113.55" } },
    res: { cookie: vi.fn(), clearCookie: vi.fn() },
  } as any);
}

describe("auth router rate-limit integration", () => {
  beforeEach(() => resetAuthRateLimitForTests());

  it("returns a uniform 429 only after the configured failed-login allowance", async () => {
    const client = caller();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(client.login({ email: "owner@example.test", password: "incorrect-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }

    await expect(client.login({ email: "owner@example.test", password: "incorrect-password" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      message: expect.stringContaining("Trop de tentatives"),
    });
  });
});
