-- Controlled customer returns: item selection, manual instructions and an
-- append-only history. This migration does not create a Stripe refund path.

ALTER TABLE `returnRequests`
  MODIFY COLUMN `status` enum('requested','approved','return_received','closed','rejected','refunded') NOT NULL DEFAULT 'requested';
ALTER TABLE `returnRequests` ADD COLUMN IF NOT EXISTS `instructions` varchar(1000);
ALTER TABLE `returnRequests` ADD COLUMN IF NOT EXISTS `returnReceivedAt` timestamp NULL;
ALTER TABLE `returnRequests` ADD COLUMN IF NOT EXISTS `closedAt` timestamp NULL;

CREATE TABLE IF NOT EXISTS `returnRequestItems` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NOT NULL,
  `returnRequestId` int NOT NULL,
  `orderItemId` int NOT NULL,
  `productId` int NOT NULL,
  `productNameSnapshot` varchar(255) NOT NULL,
  `selectedOptionsSnapshot` text,
  `quantity` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `return_request_items_store_request_idx` (`storeId`, `returnRequestId`),
  INDEX `return_request_items_store_order_item_idx` (`storeId`, `orderItemId`)
);

CREATE TABLE IF NOT EXISTS `returnRequestEvents` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NOT NULL,
  `returnRequestId` int NOT NULL,
  `action` varchar(40) NOT NULL,
  `fromStatus` varchar(40),
  `toStatus` varchar(40) NOT NULL,
  `note` varchar(1000),
  `actorUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `return_request_events_store_request_created_idx` (`storeId`, `returnRequestId`, `createdAt`)
);
