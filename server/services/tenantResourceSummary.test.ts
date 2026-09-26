import { describe, expect, it } from "vitest";
import { DEFAULT_STORE_MEDIA_QUOTA_BYTES } from "../storage";
import { buildTenantResourceSummary } from "./tenantResourceSummary";

describe("tenant resource summary", () => {
  it("reports countable records without pretending they are database bytes", () => {
    const summary = buildTenantResourceSummary({ clientStores: 2, categories: 3, products: 4, productImages: 5, variants: 6, orders: 7, carts: 8, cartItems: 9, settings: 10 });
    expect(summary.database).toMatchObject({ trackedRecords: 52, counters: { catalogue: 18, operations: 24, settings: 10 }, status: "record_count" });
    expect(summary.media.quotaCeilingBytes).toBe(2 * DEFAULT_STORE_MEDIA_QUOTA_BYTES);
    expect(summary.traffic.status).toBe("not_connected");
  });
});
