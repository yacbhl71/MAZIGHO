export type PlatformIdentitySurface = "studio" | "saas";

export type PlatformIdentity = Record<PlatformIdentitySurface, {
  logoUrl: string;
  faviconUrl: string;
}>;

export const DEFAULT_PLATFORM_IDENTITY: PlatformIdentity = {
  studio: { logoUrl: "", faviconUrl: "" },
  saas: { logoUrl: "", faviconUrl: "" },
};

function cleanUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  return normalized.startsWith("/") || /^https:\/\//i.test(normalized) ? normalized.slice(0, 2000) : "";
}

/** Safely parses the operator-wide identity without making a stored value executable. */
export function parsePlatformIdentity(value: unknown): PlatformIdentity {
  let source = value;
  if (typeof source === "string") {
    try { source = JSON.parse(source); } catch { return { ...DEFAULT_PLATFORM_IDENTITY }; }
  }
  if (!source || typeof source !== "object") return { ...DEFAULT_PLATFORM_IDENTITY };
  const record = source as Record<string, unknown>;
  const getSurface = (surface: PlatformIdentitySurface) => {
    const raw = record[surface];
    const details = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    return { logoUrl: cleanUrl(details.logoUrl), faviconUrl: cleanUrl(details.faviconUrl) };
  };
  return { studio: getSurface("studio"), saas: getSurface("saas") };
}
