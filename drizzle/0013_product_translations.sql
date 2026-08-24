CREATE TABLE IF NOT EXISTS `productTranslations` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `productId` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `longDescription` text,
  `options` text,
  `status` enum('ready', 'stale') NOT NULL DEFAULT 'ready',
  `machineGenerated` int NOT NULL DEFAULT 1,
  `sourceUpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `translatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `product_translations_product_locale_unique` (`productId`, `locale`),
  INDEX `product_translations_product_idx` (`productId`)
);
