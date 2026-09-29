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
});
