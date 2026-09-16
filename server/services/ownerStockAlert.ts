export type OwnerStockAlertSettings = {
  lowStockThreshold: number;
};

export const DEFAULT_OWNER_STOCK_ALERT_SETTINGS: OwnerStockAlertSettings = {
  lowStockThreshold: 5,
};

const MAX_THRESHOLD = 10_000;

export function normalizeOwnerStockAlertSettings(input: Partial<OwnerStockAlertSettings> | null | undefined): OwnerStockAlertSettings {
  const value = Number(input?.lowStockThreshold);
  if (!Number.isInteger(value) || value < 0 || value > MAX_THRESHOLD) {
    return { ...DEFAULT_OWNER_STOCK_ALERT_SETTINGS };
  }
  return { lowStockThreshold: value };
}

export function parseOwnerStockAlertSettings(value: string | null | undefined): OwnerStockAlertSettings {
  if (!value) return { ...DEFAULT_OWNER_STOCK_ALERT_SETTINGS };
  try {
    const parsed = JSON.parse(value) as Partial<OwnerStockAlertSettings>;
    return normalizeOwnerStockAlertSettings(parsed);
  } catch {
    return { ...DEFAULT_OWNER_STOCK_ALERT_SETTINGS };
  }
}
