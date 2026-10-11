import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./cookies";

function request(protocol: string, headers: Record<string, string> = {}, hostname?: string) {
  return { protocol, headers, hostname } as any;
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

  it("shares a normal session only between MAZIGHO subdomains", () => {
    expect(getSessionCookieOptions(request("http", { "x-forwarded-proto": "https" }, "bhll-boutique.mazigho.ch"))).toEqual({
      domain: ".mazigho.ch",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("keeps a custom client domain host-only", () => {
    expect(getSessionCookieOptions(request("http", { "x-forwarded-proto": "https" }, "boutique-client.ch"))).toEqual({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });
});
