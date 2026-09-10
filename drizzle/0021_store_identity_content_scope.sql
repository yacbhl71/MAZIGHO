-- Second multi-store phase: storefront identity, legal profile, public content and banners.
-- Existing MAZIGHO data is assigned once to the compatibility primary store.

CREATE TABLE IF NOT EXISTS `storeSettings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `description` text,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `store_settings_store_key_unique` (`storeId`, `key`),
  INDEX `store_settings_store_idx` (`storeId`)
);

INSERT IGNORE INTO `storeSettings` (`storeId`, `key`, `value`, `description`)
SELECT st.`id`, se.`key`, se.`value`, se.`description`
FROM `stores` st
INNER JOIN `settings` se ON se.`key` IN ('design_profile', 'legal_profile')
WHERE st.`slug` = 'primary-store';

ALTER TABLE `banners` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `banners`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `banners` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `banners_store_active_order_idx` ON `banners` (`storeId`, `active`, `displayOrder`);

ALTER TABLE `publicContentTranslations` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `publicContentTranslations`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `publicContentTranslations` MODIFY COLUMN `storeId` int NOT NULL;
ALTER TABLE `publicContentTranslations` DROP INDEX IF EXISTS `public_content_translations_content_locale_unique`;
CREATE UNIQUE INDEX IF NOT EXISTS `public_content_translations_store_content_locale_unique`
  ON `publicContentTranslations` (`storeId`, `contentType`, `contentId`, `locale`);
CREATE INDEX IF NOT EXISTS `public_content_translations_store_content_idx`
  ON `publicContentTranslations` (`storeId`, `contentType`, `contentId`);

-- No technical secrets, payment configuration, supplier credentials, shipping calculations,
-- currencies or marketing identifiers are moved by this migration.
