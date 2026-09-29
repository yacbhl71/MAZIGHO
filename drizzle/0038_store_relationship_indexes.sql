-- Guarantees the tenant-scoped relationship indexes before a Vercel bundle is
-- deployed. Every statement is idempotent for existing TiDB installations.
ALTER TABLE `carts` DROP INDEX IF EXISTS `carts_userId_unique`;
ALTER TABLE `promotions` DROP INDEX IF EXISTS `promotions_code_unique`;

CREATE UNIQUE INDEX IF NOT EXISTS `carts_store_user_unique` ON `carts` (`storeId`, `userId`);
CREATE INDEX IF NOT EXISTS `cart_items_store_cart_product_idx` ON `cartItems` (`storeId`, `cartId`, `productId`);
CREATE INDEX IF NOT EXISTS `reviews_store_product_status_idx` ON `reviews` (`storeId`, `productId`, `status`);
CREATE INDEX IF NOT EXISTS `contact_messages_store_status_created_idx` ON `contactMessages` (`storeId`, `status`, `createdAt`);
CREATE UNIQUE INDEX IF NOT EXISTS `promotions_store_code_unique` ON `promotions` (`storeId`, `code`);
CREATE INDEX IF NOT EXISTS `promotions_store_active_idx` ON `promotions` (`storeId`, `active`);
CREATE INDEX IF NOT EXISTS `promotion_redemptions_store_promotion_user_idx` ON `promotionRedemptions` (`storeId`, `promotionId`, `userId`);
CREATE INDEX IF NOT EXISTS `orders_store_user_created_idx` ON `orders` (`storeId`, `userId`, `createdAt`);
CREATE INDEX IF NOT EXISTS `orders_store_status_created_idx` ON `orders` (`storeId`, `status`, `createdAt`);
CREATE INDEX IF NOT EXISTS `order_items_store_order_idx` ON `orderItems` (`storeId`, `orderId`);
CREATE INDEX IF NOT EXISTS `order_decisions_store_order_idx` ON `orderDecisions` (`storeId`, `orderId`);
CREATE INDEX IF NOT EXISTS `return_requests_store_order_idx` ON `returnRequests` (`storeId`, `orderId`);
CREATE INDEX IF NOT EXISTS `return_requests_store_user_status_idx` ON `returnRequests` (`storeId`, `userId`, `status`);
