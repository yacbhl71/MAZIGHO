export function isValidMetaPixelId(value: string): boolean {
  return /^\d{5,30}$/.test(value);
}

export function isValidTikTokPixelId(value: string): boolean {
  return /^[A-Za-z0-9_-]{5,64}$/.test(value);
}

/**
 * Public pixel identifiers are not secrets, but accepting only their documented
 * shapes prevents malformed persisted values from becoming external script URLs.
 */
export function sanitizeTrackingPixels(input: { metaPixelId?: string | null; tiktokPixelId?: string | null }) {
  const metaPixelId = (input.metaPixelId || "").trim();
  const tiktokPixelId = (input.tiktokPixelId || "").trim();

  return {
    metaPixelId: isValidMetaPixelId(metaPixelId) ? metaPixelId : null,
    tiktokPixelId: isValidTikTokPixelId(tiktokPixelId) ? tiktokPixelId : null,
  };
}
