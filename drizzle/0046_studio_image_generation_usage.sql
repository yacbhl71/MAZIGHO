-- Operator-only daily counter for Studio image generation.
-- It deliberately persists aggregate usage only: no prompts, images, URLs,
-- store ids, client data, source assets or credentials.
CREATE TABLE IF NOT EXISTS `studioImageGenerationUsage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `periodKey` varchar(10) NOT NULL,
  `requestCount` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `studio_image_generation_usage_user_period_unique` (`userId`, `periodKey`),
  KEY `studio_image_generation_usage_user_period_idx` (`userId`, `periodKey`)
);
