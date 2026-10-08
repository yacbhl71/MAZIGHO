-- Optional public media URL associated with one owner-managed product variant.
-- No media bytes are stored in the database; the URL remains scoped through
-- the parent store and product in every read and write path.
ALTER TABLE `ownerProductVariants`
  ADD COLUMN IF NOT EXISTS `imageUrl` varchar(500) NULL AFTER `sku`;
