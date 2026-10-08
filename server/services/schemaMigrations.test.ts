import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const worktreeFile = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("deployment schema migrations", () => {
  it("registers the durable owner product variants schema before deployment", () => {
    const runner = worktreeFile("scripts/apply-schema-migrations.mjs");
    const migration = worktreeFile("drizzle/0037_owner_product_variants.sql");

    expect(runner).toContain('["0037_owner_product_variants", "drizzle/0037_owner_product_variants.sql"]');
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS `ownerProductVariants`");
    expect(migration).toContain("`storeId` int NOT NULL");
    expect(migration).toContain("`productId` int NOT NULL");
    expect(migration).toContain("`stock` int NOT NULL DEFAULT 0");
    expect(migration).toContain("`owner_product_variants_store_product_label_unique`");
  });

  it("registers idempotent store relationship indexes before deployment", () => {
    const runner = worktreeFile("scripts/apply-schema-migrations.mjs");
    const migration = worktreeFile("drizzle/0038_store_relationship_indexes.sql");

    expect(runner).toContain('["0038_store_relationship_indexes", "drizzle/0038_store_relationship_indexes.sql"]');
    expect(migration).toContain("CREATE UNIQUE INDEX IF NOT EXISTS `carts_store_user_unique`");
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS `contact_messages_store_status_created_idx`");
    expect(migration).toContain("ALTER TABLE `carts` DROP INDEX IF EXISTS `carts_userId_unique`");
  });

  it("registers the durable catalog section column before deployment", () => {
    const runner = worktreeFile("scripts/apply-schema-migrations.mjs");
    const migration = worktreeFile("drizzle/0039_catalog_section.sql");

    expect(runner).toContain('["0039_catalog_section", "drizzle/0039_catalog_section.sql"]');
    expect(migration).toContain("ALTER TABLE `categories`");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS `catalogSection`");
    expect(migration).toContain("enum('standard','creations')");
  });

  it("registers tenant-scoped category slug indexes before deployment", () => {
    const runner = worktreeFile("scripts/apply-schema-migrations.mjs");
    const migration = worktreeFile("drizzle/0040_categories_store_slug_index.sql");

    expect(runner).toContain('["0040_categories_store_slug_index", "drizzle/0040_categories_store_slug_index.sql"]');
    expect(migration).toContain("DROP INDEX IF EXISTS `categories_slug_unique`");
    expect(migration).toContain("CREATE UNIQUE INDEX IF NOT EXISTS `categories_store_slug_unique`");
    expect(migration).toContain("(`storeId`, `slug`)");
  });

  it("registers controlled store-copy provenance before deployment", () => {
    const runner = worktreeFile("scripts/apply-schema-migrations.mjs");
    const migration = worktreeFile("drizzle/0045_controlled_store_copy.sql");

    expect(runner).toContain('["0045_controlled_store_copy", "drizzle/0045_controlled_store_copy.sql"]');
    expect(migration).toContain("`copySourceStoreId` int NULL");
    expect(migration).toContain("`copySelection` text NULL");
    expect(migration).toContain("store_provisioning_drafts_copy_source_idx");
  });

  it("registers the aggregate-only Studio image generation usage counter", () => {
    const runner = worktreeFile("scripts/apply-schema-migrations.mjs");
    const migration = worktreeFile("drizzle/0046_studio_image_generation_usage.sql");

    expect(runner).toContain('["0046_studio_image_generation_usage", "drizzle/0046_studio_image_generation_usage.sql"]');
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS `studioImageGenerationUsage`");
    expect(migration).toContain("`userId` int NOT NULL");
    expect(migration).toContain("`periodKey` varchar(10) NOT NULL");
    expect(migration).toContain("studio_image_generation_usage_user_period_unique");
  });
  it("registers the explicit product new-badge flag before deployment", () => {
    const runner = worktreeFile("scripts/apply-schema-migrations.mjs");
    const migration = worktreeFile("drizzle/0047_product_new_badge.sql");

    expect(runner).toContain('["0047_product_new_badge", "drizzle/0047_product_new_badge.sql"]');
    expect(migration).toContain("ALTER TABLE `products`");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS `showNewBadge`");
    expect(migration).toContain("DEFAULT 0");
  });

  it("registers optional variant media without storing image bytes", () => {
    const runner = worktreeFile("scripts/apply-schema-migrations.mjs");
    const migration = worktreeFile("drizzle/0048_owner_product_variant_image.sql");

    expect(runner).toContain('["0048_owner_product_variant_image", "drizzle/0048_owner_product_variant_image.sql"]');
    expect(migration).toContain("ALTER TABLE `ownerProductVariants`");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS `imageUrl` varchar(500) NULL");
    expect(migration).not.toContain("blob");
  });

  it("registers the operator-selected payment route without payment credentials", () => {
    const runner = worktreeFile("scripts/apply-schema-migrations.mjs");
    const migration = worktreeFile("drizzle/0049_store_provisioning_payment_route.sql");

    expect(runner).toContain('["0049_store_provisioning_payment_route", "drizzle/0049_store_provisioning_payment_route.sql"]');
    expect(migration).toContain("ALTER TABLE `storeProvisioningDrafts`");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS `paymentRoute` varchar(32) NOT NULL DEFAULT 'stripe_connect'");
    expect(migration).not.toMatch(/secret|api[_ -]?key|token/i);
  });
});
