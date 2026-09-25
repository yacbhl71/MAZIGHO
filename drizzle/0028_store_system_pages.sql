CREATE TABLE IF NOT EXISTS `storeSystemPages` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NOT NULL,
  `pageId` varchar(20) NOT NULL,
  `content` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `store_system_pages_store_page_unique` (`storeId`,`pageId`),
  INDEX `store_system_pages_store_idx` (`storeId`)
);
