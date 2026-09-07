import { describe, expect, it } from "vitest";
import { isValidMetaPixelId, isValidTikTokPixelId, sanitizeTrackingPixels } from "./trackingPixels";

describe("tracking pixel identifiers", () => {
  it("accepts a numeric Meta Pixel identifier and a TikTok Pixel identifier", () => {
    expect(isValidMetaPixelId("123456789012345")).toBe(true);
    expect(isValidTikTokPixelId("C123ABC_def-456")).toBe(true);
  });

  it("refuses malformed identifiers", () => {
    expect(isValidMetaPixelId("meta-123")).toBe(false);
    expect(isValidMetaPixelId("123<script>")).toBe(false);
    expect(isValidTikTokPixelId("pixel with spaces")).toBe(false);
    expect(isValidTikTokPixelId("<script>")).toBe(false);
  });

  it("never exposes malformed or missing values to the storefront", () => {
    expect(sanitizeTrackingPixels({ metaPixelId: " 123456789012345 ", tiktokPixelId: "invalid value" })).toEqual({
      metaPixelId: "123456789012345",
      tiktokPixelId: null,
    });
    expect(sanitizeTrackingPixels({})).toEqual({ metaPixelId: null, tiktokPixelId: null });
  });
});
