import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  membership: { role: "owner", status: "active" } as { role: string; status: string } | null,
  user: {
    id: 113,
    openId: "owner-login-test",
    name: "Propriétaire test",
    email: "owner@example.test",
    passwordHash: "scrypt-v1$test",
    accountStatus: "active",
    role: "user",
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    lastSignedIn: new Date("2026-10-01T00:00:00.000Z"),
  },
}));

vi.mock("./db", () => ({
  activateAccountFromInvitation: vi.fn(),
  createPasswordUser: vi.fn(),
  getFirstActiveOwnerStoreForUser: vi.fn(),
  getStoreMembershipForUser: vi.fn(async () => state.membership),
  getUserByEmail: vi.fn(async () => state.user),
  markUserSignedIn: vi.fn(),
  requestPasswordResetToken: vi.fn(),
  resetPasswordFromToken: vi.fn(),
  updatePasswordUser: vi.fn(),
}));

vi.mock("./localAuth", () => ({
  hashPassword: vi.fn(async () => "scrypt-v1$test"),
  verifyPassword: vi.fn(async () => true),
}));

vi.mock("./transactionalEmail", () => ({
  isTransactionalEmailConfigured: vi.fn(() => false),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: { createSessionToken: vi.fn(async () => "signed-session-token") },
}));

import * as db from "./db";
import { authRouter } from "./authRouter";
import { resetAuthRateLimitForTests } from "./authRateLimit";

function callerFor(store: { id: number; isPlatformStore: number; status: string; primaryDomain: string }) {
  const cookie = vi.fn();
  return {
    client: authRouter.createCaller({
      user: null,
      store,
      req: {
        protocol: "http",
        hostname: store.primaryDomain,
        headers: { "x-forwarded-proto": "https" },
        ip: "203.0.113.56",
        socket: { remoteAddress: "203.0.113.56" },
      },
      res: { cookie, clearCookie: vi.fn() },
    } as any),
    cookie,
  };
}

describe("connexion propriétaire sur une boutique cliente", () => {
  beforeEach(() => {
    resetAuthRateLimitForTests();
    state.membership = { role: "owner", status: "active" };
    vi.clearAllMocks();
  });

  it("retourne uniquement la boutique actuellement résolue lorsqu’un propriétaire s’y connecte", async () => {
    const { client, cookie } = callerFor({ id: 11340011, isPlatformStore: 0, status: "active", primaryDomain: "bhll-boutique.mazigho.ch" });

    await expect(client.login({ email: "owner@example.test", password: "mot-de-passe-valide" })).resolves.toMatchObject({
      user: { id: 113, role: "user" },
      ownerStore: { id: 11340011, primaryDomain: "bhll-boutique.mazigho.ch", status: "active" },
    });
    expect(db.getStoreMembershipForUser).toHaveBeenCalledWith(11340011, 113);
    expect(cookie).toHaveBeenCalledWith("app_session_id", "signed-session-token", expect.objectContaining({
      domain: ".mazigho.ch",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    }));
  });

  it("ne retourne pas de destination propriétaire sans rôle owner actif sur la boutique courante", async () => {
    state.membership = { role: "manager", status: "active" };
    const { client } = callerFor({ id: 11340011, isPlatformStore: 0, status: "active", primaryDomain: "bhll-boutique.mazigho.ch" });

    await expect(client.login({ email: "owner@example.test", password: "mot-de-passe-valide" })).resolves.toMatchObject({
      user: { id: 113 },
      ownerStore: null,
    });
  });

  it("efface la session MAZIGHO partagée et une éventuelle ancienne session locale", async () => {
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    const client = authRouter.createCaller({
      user: null,
      store: null,
      req: {
        protocol: "http",
        hostname: "bhll-boutique.mazigho.ch",
        headers: { "x-forwarded-proto": "https" },
      },
      res: {
        cookie: vi.fn(),
        clearCookie: (name: string, options: Record<string, unknown>) => clearedCookies.push({ name, options }),
      },
    } as any);

    await expect(client.logout()).resolves.toEqual({ success: true });
    expect(clearedCookies).toEqual([
      { name: "app_session_id", options: expect.objectContaining({ domain: ".mazigho.ch", maxAge: -1, secure: true }) },
      { name: "app_session_id", options: expect.objectContaining({ maxAge: -1, secure: true }) },
    ]);
    expect(clearedCookies[1]?.options).not.toHaveProperty("domain");
  });
});
