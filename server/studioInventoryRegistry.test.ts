import { describe, expect, it } from "vitest";
import { paginateStudioInventory } from "../shared/studioInventoryRegistry";

const stores = Array.from({ length: 45 }, (_, index) => ({
  displayName: index === 0 ? "MAZIGHO" : `Boutique ${String(index).padStart(2, "0")}`,
  slug: index === 0 ? "mazigho" : `boutique-${index}`,
  primaryDomain: index === 0 ? "mazigho.ch" : `boutique-${index}.mazigho.ch`,
  status: index % 3 === 0 ? "setup" as const : index % 3 === 1 ? "active" as const : "limited" as const,
  isPlatformStore: index === 0 ? 1 : 0,
  commercialOfferMode: index % 2 === 0 ? "rental" as const : "perpetual_sale" as const,
}));

describe("Studio registry pagination", () => {
  it("limits a large registry to the selected page", () => {
    const result = paginateStudioInventory(stores, { page: 2, pageSize: 20 });
    expect(result.stores).toHaveLength(20);
    expect(result.pagination).toMatchObject({ page: 2, pageSize: 20, total: 45, totalPages: 3, from: 21, to: 40 });
  });

  it("filters by safe aggregate fields without exposing hidden data", () => {
    const result = paginateStudioInventory(stores, { query: "boutique-1", status: "active", pageSize: 20 });
    expect(result.stores.every(store => store.status === "active")).toBe(true);
    expect(result.stores.every(store => `${store.displayName} ${store.slug} ${store.primaryDomain}`.toLowerCase().includes("boutique-1"))).toBe(true);
  });

  it("excludes the platform store from client commercial offer filters", () => {
    const result = paginateStudioInventory(stores, { offerMode: "rental", pageSize: 100 });
    expect(result.stores.every(store => !store.isPlatformStore && store.commercialOfferMode === "rental")).toBe(true);
  });

  it("filters the large registry using an already-derived attention signal", () => {
    const result = paginateStudioInventory(stores.map((store, index) => ({ ...store, needsAttention: index % 2 === 0 })), { needsAttention: true, pageSize: 100 });
    expect(result.stores).not.toHaveLength(0);
    expect(result.stores.every(store => store.needsAttention)).toBe(true);
  });

  it("clamps an obsolete page after filters reduce the result set", () => {
    const result = paginateStudioInventory(stores, { status: "limited", page: 99, pageSize: 20 });
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.total).toBeGreaterThan(0);
  });
});
