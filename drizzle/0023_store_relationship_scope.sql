-- Fourth multi-store phase: customer relationship and order isolation.
-- Existing MAZIGHO records are assigned to the compatibility primary store.

ALTER TABLE `carts` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `carts`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `carts` MODIFY COLUMN `storeId` int NOT NULL;
ALTER TABLE `carts` DROP INDEX IF EXISTS `carts_userId_unique`;
CREATE UNIQUE INDEX IF NOT EXISTS `carts_store_user_unique` ON `carts` (`storeId`, `userId`);

ALTER TABLE `cartItems` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `cartItems` ci
INNER JOIN `carts` c ON c.`id` = ci.`cartId`
SET ci.`storeId` = c.`storeId`
WHERE ci.`storeId` IS NULL;
ALTER TABLE `cartItems` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `cart_items_store_cart_product_idx`
  ON `cartItems` (`storeId`, `cartId`, `productId`);

ALTER TABLE `reviews` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `reviews` r
INNER JOIN `products` p ON p.`id` = r.`productId`
SET r.`storeId` = p.`storeId`
WHERE r.`storeId` IS NULL;
UPDATE `reviews`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `reviews` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `reviews_store_product_status_idx`
  ON `reviews` (`storeId`, `productId`, `status`);

ALTER TABLE `contactMessages` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `contactMessages`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `contactMessages` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `contact_messages_store_status_created_idx`
  ON `contactMessages` (`storeId`, `status`, `createdAt`);

ALTER TABLE `promotions` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `promotions`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `promotions` MODIFY COLUMN `storeId` int NOT NULL;
ALTER TABLE `promotions` DROP INDEX IF EXISTS `promotions_code_unique`;
CREATE UNIQUE INDEX IF NOT EXISTS `promotions_store_code_unique` ON `promotions` (`storeId`, `code`);
CREATE INDEX IF NOT EXISTS `promotions_store_active_idx` ON `promotions` (`storeId`, `active`);

ALTER TABLE `promotionRedemptions` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `promotionRedemptions` pr
INNER JOIN `promotions` p ON p.`id` = pr.`promotionId`
SET pr.`storeId` = p.`storeId`
WHERE pr.`storeId` IS NULL;
UPDATE `promotionRedemptions`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `promotionRedemptions` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `promotion_redemptions_store_promotion_user_idx`
  ON `promotionRedemptions` (`storeId`, `promotionId`, `userId`);

ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `orders`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `orders` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `orders_store_user_created_idx`
  ON `orders` (`storeId`, `userId`, `createdAt`);
CREATE INDEX IF NOT EXISTS `orders_store_status_created_idx`
  ON `orders` (`storeId`, `status`, `createdAt`);

ALTER TABLE `orderItems` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `orderItems` oi
INNER JOIN `orders` o ON o.`id` = oi.`orderId`
SET oi.`storeId` = o.`storeId`
WHERE oi.`storeId` IS NULL;
ALTER TABLE `orderItems` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `order_items_store_order_idx`
  ON `orderItems` (`storeId`, `orderId`);

ALTER TABLE `orderDecisions` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `orderDecisions` od
INNER JOIN `orders` o ON o.`id` = od.`orderId`
SET od.`storeId` = o.`storeId`
WHERE od.`storeId` IS NULL;
UPDATE `orderDecisions`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `orderDecisions` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `order_decisions_store_order_idx`
  ON `orderDecisions` (`storeId`, `orderId`);

CREATE TABLE IF NOT EXISTS `returnRequests` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NULL,
  `orderId` int NOT NULL,
  `userId` int NOT NULL,
  `reason` varchar(1000) NOT NULL,
  `status` enum('requested','approved','rejected','refunded') NOT NULL DEFAULT 'requested',
  `resolutionNote` varchar(1000),
  `refundAmount` int,
  `actorUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `return_requests_order_idx` (`orderId`),
  INDEX `return_requests_user_idx` (`userId`),
  INDEX `return_requests_status_idx` (`status`)
);
ALTER TABLE `returnRequests` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `returnRequests` rr
INNER JOIN `orders` o ON o.`id` = rr.`orderId`
SET rr.`storeId` = o.`storeId`
WHERE rr.`storeId` IS NULL;
UPDATE `returnRequests`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `returnRequests` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `return_requests_store_order_idx`
  ON `returnRequests` (`storeId`, `orderId`);
CREATE INDEX IF NOT EXISTS `return_requests_store_user_status_idx`
  ON `returnRequests` (`storeId`, `userId`, `status`);

-- Supplier fulfillment rows, Stripe/Odoo integration and accounting are scoped in
-- the next operations phase. This migration deliberately does not change payment behavior.
