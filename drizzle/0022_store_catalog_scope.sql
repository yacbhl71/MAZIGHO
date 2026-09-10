-- Third multi-store phase: catalogue isolation.
-- Existing MAZIGHO catalogue data is assigned to the compatibility primary store.

ALTER TABLE `categories` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `categories`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `categories` MODIFY COLUMN `storeId` int NOT NULL;
ALTER TABLE `categories` DROP INDEX IF EXISTS `categories_slug_unique`;
CREATE UNIQUE INDEX IF NOT EXISTS `categories_store_slug_unique` ON `categories` (`storeId`, `slug`);
CREATE INDEX IF NOT EXISTS `categories_store_order_idx` ON `categories` (`storeId`, `displayOrder`);

ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `products`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `products` MODIFY COLUMN `storeId` int NOT NULL;
ALTER TABLE `products` DROP INDEX IF EXISTS `products_slug_unique`;
CREATE UNIQUE INDEX IF NOT EXISTS `products_store_slug_unique` ON `products` (`storeId`, `slug`);
CREATE INDEX IF NOT EXISTS `products_store_category_idx` ON `products` (`storeId`, `categoryId`);
CREATE INDEX IF NOT EXISTS `products_store_supplier_idx` ON `products` (`storeId`, `supplier`, `supplierProductId`);

ALTER TABLE `productCategories` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `productCategories` pc
INNER JOIN `products` p ON p.`id` = pc.`productId`
SET pc.`storeId` = p.`storeId`
WHERE pc.`storeId` IS NULL;
ALTER TABLE `productCategories` MODIFY COLUMN `storeId` int NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS `product_categories_store_product_category_unique`
  ON `productCategories` (`storeId`, `productId`, `categoryId`);
CREATE INDEX IF NOT EXISTS `product_categories_store_product_idx` ON `productCategories` (`storeId`, `productId`);

ALTER TABLE `productImages` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `productImages` pi
INNER JOIN `products` p ON p.`id` = pi.`productId`
SET pi.`storeId` = p.`storeId`
WHERE pi.`storeId` IS NULL;
ALTER TABLE `productImages` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `product_images_store_product_order_idx`
  ON `productImages` (`storeId`, `productId`, `displayOrder`);

ALTER TABLE `productTranslations` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `productTranslations` pt
INNER JOIN `products` p ON p.`id` = pt.`productId`
SET pt.`storeId` = p.`storeId`
WHERE pt.`storeId` IS NULL;
ALTER TABLE `productTranslations` MODIFY COLUMN `storeId` int NOT NULL;
ALTER TABLE `productTranslations` DROP INDEX IF EXISTS `product_translations_product_locale_unique`;
CREATE UNIQUE INDEX IF NOT EXISTS `product_translations_store_product_locale_unique`
  ON `productTranslations` (`storeId`, `productId`, `locale`);
CREATE INDEX IF NOT EXISTS `product_translations_store_product_idx`
  ON `productTranslations` (`storeId`, `productId`);

ALTER TABLE `productDeliveryProfiles` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `productDeliveryProfiles` pdp
INNER JOIN `products` p ON p.`id` = pdp.`productId`
SET pdp.`storeId` = p.`storeId`
WHERE pdp.`storeId` IS NULL;
ALTER TABLE `productDeliveryProfiles` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `delivery_profiles_store_product_country_idx`
  ON `productDeliveryProfiles` (`storeId`, `productId`, `countryCode`);

-- Product-linked customer records and transactional records remain out of scope here.
-- They will move in their dedicated relationship and operations migrations.
