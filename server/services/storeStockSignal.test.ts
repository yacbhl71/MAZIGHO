import { describe, expect, it } from "vitest";
import { buildStoreStockSignal } from "./storeStockSignal";

describe("store stock signal", () => {
  it("uses active variants instead of a parent product global quantity", () => {
    const signal = buildStoreStockSignal({
      lowStockThreshold: 3,
      products: [
        { id: 10, storeId: 1, status: "active", stock: 99 },
        { id: 11, storeId: 1, status: "active", stock: 2 },
      ],
      variants: [
        { productId: 10, storeId: 1, status: "active", stock: 0 },
        { productId: 10, storeId: 1, status: "active", stock: 3 },
        { productId: 10, storeId: 1, status: "inactive", stock: 90 },
      ],
    });

    expect(signal).toEqual({ tracked: 3, available: 0, low: 2, out: 1, lowStockThreshold: 3 });
  });

  it("ignores drafts and treats zero threshold as rupture-only monitoring", () => {
    const signal = buildStoreStockSignal({
      lowStockThreshold: 0,
      products: [
        { id: 10, storeId: 1, status: "active", stock: 1 },
        { id: 11, storeId: 1, status: "draft", stock: 0 },
        { id: 12, storeId: 1, status: "active", stock: 0 },
      ],
      variants: [],
    });

    expect(signal).toEqual({ tracked: 2, available: 1, low: 0, out: 1, lowStockThreshold: 0 });
  });

  it("uses a safe default when an invalid threshold reaches the aggregate", () => {
    const signal = buildStoreStockSignal({
      lowStockThreshold: -1,
      products: [{ id: 10, storeId: 1, status: "active", stock: 5 }],
      variants: [],
    });

    expect(signal).toEqual({ tracked: 1, available: 0, low: 1, out: 0, lowStockThreshold: 5 });
  });
});
