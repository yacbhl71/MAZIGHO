import { describe, expect, it } from "vitest";
import { DEFAULT_OWNER_STOCK_ALERT_SETTINGS, normalizeOwnerStockAlertSettings, parseOwnerStockAlertSettings } from "./ownerStockAlert";

describe("owner stock alert settings", () => {
  it("uses a conservative default when no setting exists", () => {
    expect(parseOwnerStockAlertSettings(null)).toEqual(DEFAULT_OWNER_STOCK_ALERT_SETTINGS);
  });

  it("keeps an integer threshold including zero", () => {
    expect(normalizeOwnerStockAlertSettings({ lowStockThreshold: 0 })).toEqual({ lowStockThreshold: 0 });
    expect(parseOwnerStockAlertSettings('{"lowStockThreshold":12}')).toEqual({ lowStockThreshold: 12 });
  });

  it("falls back safely for malformed or out-of-range values", () => {
    expect(parseOwnerStockAlertSettings("invalid")).toEqual(DEFAULT_OWNER_STOCK_ALERT_SETTINGS);
    expect(normalizeOwnerStockAlertSettings({ lowStockThreshold: -1 })).toEqual(DEFAULT_OWNER_STOCK_ALERT_SETTINGS);
    expect(normalizeOwnerStockAlertSettings({ lowStockThreshold: 10001 })).toEqual(DEFAULT_OWNER_STOCK_ALERT_SETTINGS);
  });
});
