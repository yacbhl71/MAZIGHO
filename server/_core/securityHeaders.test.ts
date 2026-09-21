import { describe, expect, it } from "vitest";
import { getSecurityHeaders } from "./securityHeaders";

describe("response security headers", () => {
  it("uses report-only CSP while enforcing safe baseline headers", () => {
    const headers = getSecurityHeaders({ isProduction: true, isSecureRequest: true });

    expect(headers["Content-Security-Policy-Report-Only"]).toContain("frame-ancestors 'none'");
    expect(headers["Content-Security-Policy-Report-Only"]).toContain("https://js.stripe.com");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Strict-Transport-Security"]).toContain("includeSubDomains");
    expect(headers["Content-Security-Policy"]).toBeUndefined();
  });

  it("does not send HSTS for a non-secure development request", () => {
    const headers = getSecurityHeaders({ isProduction: false, isSecureRequest: false });

    expect(headers["Strict-Transport-Security"]).toBeUndefined();
    expect(headers["Content-Security-Policy-Report-Only"]).toContain("'unsafe-eval'");
    expect(headers["Content-Security-Policy-Report-Only"]).toContain("ws:");
  });
});
