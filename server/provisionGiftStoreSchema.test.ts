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
    expect(implementation).toContain("for (const category of starterCategories)");
    expect(implementation).not.toContain("values(starterCategories.map");
  });

  it("removes the legacy global category slug index as part of the catalogue repair", () => {
    const start = databaseSource.indexOf("async function ensureStoreCatalogScopeSchema");
    const end = databaseSource.indexOf("async function ensureStoreRelationshipScopeSchema", start);
    const implementation = databaseSource.slice(start, end);

    expect(implementation).toContain("SHOW INDEX FROM `categories`");
    expect(implementation).toContain("isLegacyGlobalSlugUnique");
    expect(implementation).toContain("DROP INDEX IF EXISTS `categories_slug_unique`");
    expect(implementation).toContain("CREATE UNIQUE INDEX `categories_store_slug_unique` ON `categories` (`storeId`, `slug`)");
  });

  it("persists a bounded launch-market profile without inferring payment, carrier or legal data", () => {
    const start = databaseSource.indexOf("export async function provisionGiftStoreFromDraft");
    const end = databaseSource.indexOf("export type StudioProvisioningDraftInput", start);
    const implementation = databaseSource.slice(start, end);

    expect(implementation).toContain('key: "provisioning_launch_market"');
    expect(implementation).toContain('key: "owner_market_settings"');
    expect(implementation).toContain('key: "store_currency_rate_review_required"');
    expect(implementation).not.toContain("stripeAccountId");
    expect(implementation).not.toContain("carrierAccount");
  });

  it("records an operator-selected payment route without enabling a payment method", () => {
    const start = databaseSource.indexOf("export async function provisionGiftStoreFromDraft");
    const end = databaseSource.indexOf("export type StudioProvisioningDraftInput", start);
    const implementation = databaseSource.slice(start, end);

    expect(implementation).toContain('key: "payment_route"');
    expect(implementation).toContain('value: draft.paymentRoute || "stripe_connect"');
    expect(implementation).toContain("aucune méthode n’est activée automatiquement");
    expect(implementation).not.toContain("stripeAccountId");
  });

  it("accepts a catalogue import for any Studio-provisioned store still in setup", () => {
    const start = databaseSource.indexOf("async function assertStudioCatalogueImportTarget");
    const end = databaseSource.indexOf("export async function getStudioProvisioningDraftReviews", start);
    const implementation = databaseSource.slice(start, end);

    expect(implementation).toContain("draft?.provisionedStoreId !== storeId");
    expect(implementation).toContain('store.status !== "setup"');
    expect(implementation).toContain("store.isPlatformStore");
    expect(implementation).not.toContain("STUDIO_CATALOGUE_IMPORT_DRAFT_PREFIX");
  });
});
