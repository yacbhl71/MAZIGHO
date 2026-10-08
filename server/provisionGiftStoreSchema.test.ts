import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const databaseSource = readFileSync(resolve(import.meta.dirname, "db.ts"), "utf8");

describe("provisionGiftStoreFromDraft schema prerequisites", () => {
  it("repairs the tenant-scoped catalogue index before inserting starter categories", () => {
    const start = databaseSource.indexOf("export async function provisionGiftStoreFromDraft");
    const end = databaseSource.indexOf("export type StudioProvisioningDraftInput", start);
    const implementation = databaseSource.slice(start, end);

    expect(implementation).toContain("await ensureStoreCatalogScopeSchema();");
    expect(implementation.indexOf("await ensureStoreCatalogScopeSchema();")).toBeLessThan(
      implementation.indexOf("return db.transaction"),
    );
  });

  it("removes the legacy global category slug index as part of the catalogue repair", () => {
    const start = databaseSource.indexOf("async function ensureStoreCatalogScopeSchema");
    const end = databaseSource.indexOf("async function ensureStoreRelationshipScopeSchema", start);
    const implementation = databaseSource.slice(start, end);

    expect(implementation).toContain("DROP INDEX IF EXISTS `categories_slug_unique`");
    expect(implementation).toContain("CREATE UNIQUE INDEX `categories_store_slug_unique` ON `categories` (`storeId`, `slug`)");
  });
});
