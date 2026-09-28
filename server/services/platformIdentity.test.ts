import { describe, expect, it } from "vitest";
import { DEFAULT_PLATFORM_IDENTITY, parsePlatformIdentity } from "../../shared/platformIdentity";

describe("platform identity policy", () => {
  it("keeps the default MAZIGHO identity when no saved setting exists", () => {
    expect(parsePlatformIdentity(null)).toEqual(DEFAULT_PLATFORM_IDENTITY);
    expect(parsePlatformIdentity("not-json")).toEqual(DEFAULT_PLATFORM_IDENTITY);
  });

  it("accepts only safe internal paths or HTTPS identity assets", () => {
    expect(parsePlatformIdentity(JSON.stringify({
      studio: { logoUrl: "https://cdn.example.test/studio.webp", faviconUrl: "/studio.ico" },
      saas: { logoUrl: "javascript:alert(1)", faviconUrl: "http://unsafe.example/favicon.ico" },
    }))).toEqual({
      studio: { logoUrl: "https://cdn.example.test/studio.webp", faviconUrl: "/studio.ico" },
      saas: { logoUrl: "", faviconUrl: "" },
    });
  });
});
