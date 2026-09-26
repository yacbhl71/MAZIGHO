import { describe, expect, it } from "vitest";
import { SUPPORT_IMPERSONATION_TTL_MS, normalizeSupportImpersonationIdentity, supportImpersonationExpiresAt } from "./supportImpersonationSession";

describe("support impersonation session policy", () => {
  it("keeps only operator, target and store identifiers in the temporary claim", () => {
    expect(normalizeSupportImpersonationIdentity({
      operatorOpenId: "operator-42",
      targetOpenId: "owner-17",
      storeId: 12,
      password: "never-accepted",
      apiKey: "never-accepted",
    })).toEqual({ operatorOpenId: "operator-42", targetOpenId: "owner-17", storeId: 12 });
  });

  it("rejects absent or malformed identities", () => {
    expect(() => normalizeSupportImpersonationIdentity({ operatorOpenId: "", targetOpenId: "owner", storeId: 1 })).toThrow("SUPPORT_IMPERSONATION_INVALID");
    expect(() => normalizeSupportImpersonationIdentity({ operatorOpenId: "operator", targetOpenId: "owner", storeId: 0 })).toThrow("SUPPORT_IMPERSONATION_INVALID");
  });

  it("uses a short fixed expiry", () => {
    const now = Date.UTC(2026, 8, 26, 8, 0, 0);
    expect(new Date(supportImpersonationExpiresAt(now)).getTime() - now).toBe(SUPPORT_IMPERSONATION_TTL_MS);
    expect(SUPPORT_IMPERSONATION_TTL_MS).toBe(15 * 60 * 1000);
  });
});
