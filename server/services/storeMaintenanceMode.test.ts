import { describe, expect, it } from "vitest";
import { DEFAULT_STORE_MAINTENANCE_MODE, parseStoreMaintenanceMode } from "../../shared/storeMaintenanceMode";

describe("store maintenance mode policy", () => {
  it("defaults safely to an accessible storefront for absent or malformed data", () => {
    expect(parseStoreMaintenanceMode(null)).toEqual(DEFAULT_STORE_MAINTENANCE_MODE);
    expect(parseStoreMaintenanceMode("not-json")).toEqual(DEFAULT_STORE_MAINTENANCE_MODE);
    expect(parseStoreMaintenanceMode('{"enabled":"true"}')).toMatchObject({ enabled: false });
  });

  it("keeps the configured public copy while constraining it", () => {
    const title = `  ${"A".repeat(180)}  `;
    const message = `  ${"B".repeat(2020)}  `;
    expect(parseStoreMaintenanceMode({ enabled: true, title, message })).toEqual({
      enabled: true,
      title: "A".repeat(160),
      message: "B".repeat(2000),
    });
  });
});
