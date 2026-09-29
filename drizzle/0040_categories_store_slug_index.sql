-- Categories are tenant-scoped. Remove the legacy global slug uniqueness so
-- separate boutiques may use familiar category names such as "Mode".
ALTER TABLE `categories`
  DROP INDEX IF EXISTS `categories_slug_unique`;

CREATE UNIQUE INDEX IF NOT EXISTS `categories_store_slug_unique`
  ON `categories` (`storeId`, `slug`);

CREATE INDEX IF NOT EXISTS `categories_store_order_idx`
  ON `categories` (`storeId`, `displayOrder`);
