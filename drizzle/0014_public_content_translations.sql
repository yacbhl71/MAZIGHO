CREATE TABLE IF NOT EXISTS `publicContentTranslations` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `contentType` enum('design', 'banner', 'category') NOT NULL,
  `contentId` int NOT NULL,
  `locale` varchar(10) NOT NULL,
  `payload` text NOT NULL,
  `status` enum('ready', 'stale') NOT NULL DEFAULT 'ready',
  `machineGenerated` int NOT NULL DEFAULT 1,
  `sourceUpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `translatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `public_content_translations_content_locale_unique` (`contentType`, `contentId`, `locale`),
  INDEX `public_content_translations_content_idx` (`contentType`, `contentId`)
);
