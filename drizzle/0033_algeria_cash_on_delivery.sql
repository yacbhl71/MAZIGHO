-- Algeria cash-on-delivery orders use a tenant-scoped idempotency key.
-- It contains no customer, card, merchant or provider data.
ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `cashOnDeliveryRequestId` varchar(64) NULL;

CREATE UNIQUE INDEX `orders_store_cash_on_delivery_request_unique`
  ON `orders` (`storeId`, `cashOnDeliveryRequestId`);
