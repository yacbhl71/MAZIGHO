import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./cookies";

function request(protocol: string, headers: Record<string, string> = {}) {
  return { protocol, headers } as any;
}

describe("session cookie policy", () => {
  it("uses Lax with Secure behind an HTTPS proxy", () => {
    expect(getSessionCookieOptions(request("http", { "x-forwarded-proto": "https" }))).toEqual({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("keeps the same cross-site policy on local HTTP while omitting Secure", () => {
    expect(getSessionCookieOptions(request("http"))).toEqual({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  });
});
