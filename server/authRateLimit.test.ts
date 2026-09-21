import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  checkAuthRateLimit,
  clearAuthRateLimit,
  consumeAuthRateLimit,
  resetAuthRateLimitForTests,
} from "./authRateLimit";

const baseTime = 1_700_000_000_000;

function request(ip = "203.0.113.12", headers: Record<string, string> = {}) {
  return { ip, headers, socket: { remoteAddress: ip } } as any;
}

describe("authentication rate limit", () => {
  const originalVercel = process.env.VERCEL;

  beforeEach(() => {
    resetAuthRateLimitForTests();
    delete process.env.VERCEL;
  });

  afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  });

  it("allows five failed login slots for an address then blocks the next attempt", () => {
    const req = request();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(checkAuthRateLimit("login", req, "owner@example.test", baseTime).allowed).toBe(true);
      expect(consumeAuthRateLimit("login", req, "owner@example.test", baseTime).allowed).toBe(true);
    }

    const blocked = checkAuthRateLimit("login", req, "owner@example.test", baseTime);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(900);
  });

  it("clears a login failure bucket only after an authenticated success", () => {
    const req = request();
    for (let attempt = 0; attempt < 5; attempt += 1) consumeAuthRateLimit("login", req, "owner@example.test", baseTime);
    expect(checkAuthRateLimit("login", req, "owner@example.test", baseTime).allowed).toBe(false);

    clearAuthRateLimit("login", req, "owner@example.test");
    expect(checkAuthRateLimit("login", req, "owner@example.test", baseTime).allowed).toBe(true);
  });

  it("expires quota buckets at the end of their policy window", () => {
    const req = request();
    for (let attempt = 0; attempt < 5; attempt += 1) consumeAuthRateLimit("login", req, "owner@example.test", baseTime);

    expect(checkAuthRateLimit("login", req, "owner@example.test", baseTime + 15 * 60 * 1000 - 1).allowed).toBe(false);
    expect(checkAuthRateLimit("login", req, "owner@example.test", baseTime + 15 * 60 * 1000).allowed).toBe(true);
  });

  it("uses the Vercel forwarding header only when deployed behind Vercel", () => {
    const firstProxy = request("127.0.0.1", { "x-forwarded-for": "198.51.100.8, 10.0.0.1" });
    const secondProxy = request("127.0.0.2", { "x-forwarded-for": "198.51.100.8, 10.0.0.2" });

    for (let attempt = 0; attempt < 8; attempt += 1) consumeAuthRateLimit("register", firstProxy, `new-${attempt}@example.test`, baseTime);
    expect(checkAuthRateLimit("register", secondProxy, "other@example.test", baseTime).allowed).toBe(true);

    resetAuthRateLimitForTests();
    process.env.VERCEL = "1";
    for (let attempt = 0; attempt < 8; attempt += 1) consumeAuthRateLimit("register", firstProxy, `new-${attempt}@example.test`, baseTime);
    expect(checkAuthRateLimit("register", secondProxy, "other@example.test", baseTime).allowed).toBe(false);
  });
});
