import { describe, expect, it } from "vitest";
import {
  assertStudioStoreCopyDestination,
  assertStudioStoreCopySource,
  normalizeStudioStoreCopySelection,
  selectedStudioStoreCopyScopes,
  studioStoreCopyNeverCopied,
} from "./services/storeCopyPolicy";

describe("controlled Studio store copy policy", () => {
  it("expands dependent catalogue choices without enabling unrelated scopes", () => {
    const selection = normalizeStudioStoreCopySelection({ productMedia: true });
    expect(selection).toMatchObject({ productMedia: true, products: true, categories: true, variants: false, storefrontStyle: false });
    expect(selectedStudioStoreCopyScopes(selection)).toEqual(["categories", "products", "productMedia"]);
  });

  it("keeps a visual and navigation-only copy bounded", () => {
    const selection = normalizeStudioStoreCopySelection({ storefrontStyle: true, navigation: true });
    expect(selectedStudioStoreCopyScopes(selection)).toEqual(["storefrontStyle", "navigation"]);
    expect(selection.products).toBe(false);
    expect(selection.categories).toBe(false);
  });

  it("refuses the platform and inactive source states", () => {
    expect(() => assertStudioStoreCopySource({ isPlatformStore: true, status: "active" })).toThrow("STORE_COPY_PLATFORM_SOURCE_FORBIDDEN");
    expect(() => assertStudioStoreCopySource({ isPlatformStore: false, status: "suspended" })).toThrow("STORE_COPY_SOURCE_NOT_ELIGIBLE");
    expect(() => assertStudioStoreCopySource({ isPlatformStore: false, status: "active" })).not.toThrow();
  });

  it("requires a distinct, non-platform setup destination", () => {
    expect(() => assertStudioStoreCopyDestination({ sourceStoreId: 4, destinationStoreId: 4, status: "setup", isPlatformStore: false })).toThrow("STORE_COPY_SOURCE_DESTINATION_MATCH");
    expect(() => assertStudioStoreCopyDestination({ sourceStoreId: 4, destinationStoreId: 5, status: "active", isPlatformStore: false })).toThrow("STORE_COPY_DESTINATION_NOT_ISOLATED_SETUP");
    expect(() => assertStudioStoreCopyDestination({ sourceStoreId: 4, destinationStoreId: 5, status: "setup", isPlatformStore: false })).not.toThrow();
  });

  it("names the irreversible exclusions explicitly", () => {
    expect(studioStoreCopyNeverCopied.join(" ")).toMatch(/clients/);
    expect(studioStoreCopyNeverCopied.join(" ")).toMatch(/paiements/);
    expect(studioStoreCopyNeverCopied.join(" ")).toMatch(/secrets/);
    expect(studioStoreCopyNeverCopied.join(" ")).toMatch(/fournisseurs/);
  });
});
