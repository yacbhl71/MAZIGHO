import { describe, expect, it } from "vitest";
import { studioExistingCatalogueStoreSlug } from "./db";

describe("private Studio catalogue slugs", () => {
  it("keeps the visible label separate from a tenant-unique routing key", () => {
    expect(
      studioExistingCatalogueStoreSlug(
        "Mode",
        new Set(),
        "nouvelle-categorie",
        6570019
      )
    ).toBe("mode-6570019");
  });

  it("stays unique when the same prepared boutique already has the label", () => {
    expect(
      studioExistingCatalogueStoreSlug(
        "Mode",
        new Set(["mode-6570019"]),
        "nouvelle-categorie",
        6570019
      )
    ).toBe("mode-6570019-2");
  });
});
