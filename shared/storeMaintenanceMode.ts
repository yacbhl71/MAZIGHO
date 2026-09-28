export type StoreMaintenanceMode = {
  enabled: boolean;
  title: string;
  message: string;
};

export const DEFAULT_STORE_MAINTENANCE_MODE: StoreMaintenanceMode = {
  enabled: false,
  title: "Nous préparons quelque chose de beau",
  message: "La boutique est momentanément en maintenance. Revenez très bientôt.",
};

function cleanText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim().replace(/\s+/g, " ").slice(0, maxLength);
  return cleaned || fallback;
}

/**
 * Parses a tenant-owned maintenance setting defensively. A malformed legacy
 * value must never hide a storefront or turn a configuration screen into an
 * outage, therefore it falls back to maintenance being disabled.
 */
export function parseStoreMaintenanceMode(value: unknown): StoreMaintenanceMode {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_STORE_MAINTENANCE_MODE };
    const candidate = parsed as Partial<StoreMaintenanceMode>;
    return {
      enabled: candidate.enabled === true,
      title: cleanText(candidate.title, DEFAULT_STORE_MAINTENANCE_MODE.title, 160),
      message: cleanText(candidate.message, DEFAULT_STORE_MAINTENANCE_MODE.message, 2000),
    };
  } catch {
    return { ...DEFAULT_STORE_MAINTENANCE_MODE };
  }
}

export function normalizeStoreMaintenanceMode(input: StoreMaintenanceMode): StoreMaintenanceMode {
  return parseStoreMaintenanceMode(input);
}
