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
});
