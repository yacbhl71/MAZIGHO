CREATE TABLE IF NOT EXISTS `stores` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `slug` varchar(80) NOT NULL,
  `displayName` varchar(160) NOT NULL,
  `primaryDomain` varchar(255) NOT NULL,
  `status` enum('setup','active','limited','suspended','closed') NOT NULL DEFAULT 'setup',
  `isPlatformStore` tinyint NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `stores_slug_unique` (`slug`),
  UNIQUE KEY `stores_domain_unique` (`primaryDomain`),
  INDEX `stores_status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `storeMemberships` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('owner','manager','catalog_editor','support_agent','order_operator','accountant','viewer') NOT NULL DEFAULT 'viewer',
  `status` enum('active','blocked') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `store_memberships_store_user_unique` (`storeId`,`userId`),
  INDEX `store_memberships_user_idx` (`userId`),
  INDEX `store_memberships_store_idx` (`storeId`)
);

-- Generic compatibility record only: existing business data remains untouched in this first foundation.
INSERT INTO `stores` (`slug`,`displayName`,`primaryDomain`,`status`,`isPlatformStore`)
VALUES ('primary-store','Boutique principale','primary.local','active',1)
ON DUPLICATE KEY UPDATE `slug` = `slug`;

-- Existing administrators retain owner access to the compatibility store; no other account is elevated.
INSERT IGNORE INTO `storeMemberships` (`storeId`,`userId`,`role`,`status`)
SELECT s.id, u.id, 'owner', 'active'
FROM `stores` s
INNER JOIN `users` u ON u.role = 'admin'
WHERE s.slug = 'primary-store';

ALTER TABLE `auditLogs` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `auditLogs`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `auditLogs` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX `audit_logs_store_idx` ON `auditLogs` (`storeId`);
