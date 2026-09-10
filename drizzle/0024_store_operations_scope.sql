-- Fifth multi-store phase: operational records and scheduled storefront campaigns.
-- Existing MAZIGHO rows are attached to the compatibility primary store.
-- Provider message IDs, external references and idempotency keys remain globally unique:
-- they are provider-level deduplication safeguards, not storefront-visible identifiers.

CREATE TABLE IF NOT EXISTS `orderFulfillmentJobs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NULL,
  `orderId` int NOT NULL,
  `provider` varchar(40) NOT NULL,
  `jobType` enum('prepare_cj_sandbox','prepare_cj_live','process_cj_event') NOT NULL,
  `state` enum('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  `idempotencyKey` varchar(255) NOT NULL,
  `attempts` int NOT NULL DEFAULT 0,
  `lastError` varchar(1000),
  `availableAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lockedAt` timestamp NULL,
  `completedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `order_fulfillment_jobs_idempotency_unique` (`idempotencyKey`)
);
CREATE TABLE IF NOT EXISTS `orderSupplierOrders` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NULL,
  `orderId` int NOT NULL,
  `provider` varchar(40) NOT NULL,
  `mode` enum('sandbox','live') NOT NULL,
  `externalReference` varchar(128) NOT NULL,
  `providerOrderId` varchar(200),
  `providerOrderNumber` varchar(200),
  `providerShipmentOrderId` varchar(200),
  `state` enum('draft','payment_review','payment_pending','paid','exception','shipped','delivered','cancelled') NOT NULL DEFAULT 'draft',
  `paymentMode` enum('none','page','balance') NOT NULL DEFAULT 'none',
  `paymentUrl` varchar(1000),
  `supplierCurrency` varchar(3) NOT NULL DEFAULT 'USD',
  `supplierProductAmount` int,
  `supplierShippingAmount` int,
  `supplierTaxAmount` int,
  `supplierTotalAmount` int,
  `exchangeRateChf` decimal(10,6),
  `customerSaleAmount` int NOT NULL,
  `quoteSnapshot` text,
  `orderSnapshot` text,
  `approvalActorUserId` int,
  `approvedAt` timestamp NULL,
  `paidAt` timestamp NULL,
  `trackingNumber` varchar(200),
  `trackingProvider` varchar(200),
  `trackingUrl` varchar(1000),
  `trackingStatus` varchar(80),
  `lastError` varchar(1000),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `order_supplier_orders_reference_unique` (`externalReference`)
);
CREATE TABLE IF NOT EXISTS `supplierWebhookEvents` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NULL,
  `provider` varchar(40) NOT NULL,
  `messageId` varchar(200) NOT NULL,
  `eventType` varchar(40) NOT NULL,
  `messageType` varchar(40) NOT NULL,
  `providerOrderId` varchar(200),
  `externalReference` varchar(200),
  `payload` text,
  `processingState` enum('received','processed','ignored','failed') NOT NULL DEFAULT 'received',
  `processingError` varchar(1000),
  `receivedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processedAt` timestamp NULL,
  UNIQUE KEY `supplier_webhook_events_message_unique` (`messageId`)
);

ALTER TABLE `orderFulfillmentJobs` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `orderFulfillmentJobs` j
INNER JOIN `orders` o ON o.`id` = j.`orderId`
SET j.`storeId` = o.`storeId`
WHERE j.`storeId` IS NULL;
UPDATE `orderFulfillmentJobs`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `orderFulfillmentJobs` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `order_fulfillment_jobs_store_order_idx`
  ON `orderFulfillmentJobs` (`storeId`, `orderId`);
CREATE INDEX IF NOT EXISTS `order_fulfillment_jobs_store_state_available_idx`
  ON `orderFulfillmentJobs` (`storeId`, `state`, `availableAt`);

ALTER TABLE `orderSupplierOrders` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `orderSupplierOrders` so
INNER JOIN `orders` o ON o.`id` = so.`orderId`
SET so.`storeId` = o.`storeId`
WHERE so.`storeId` IS NULL;
UPDATE `orderSupplierOrders`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `orderSupplierOrders` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `order_supplier_orders_store_order_idx`
  ON `orderSupplierOrders` (`storeId`, `orderId`);
CREATE INDEX IF NOT EXISTS `order_supplier_orders_store_provider_order_idx`
  ON `orderSupplierOrders` (`storeId`, `provider`, `providerOrderId`);

-- Supplier callbacks can arrive before an order is known. Those unmatched events
-- stay with storeId NULL and are intentionally excluded from storefront views.
ALTER TABLE `supplierWebhookEvents` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `supplierWebhookEvents` e
INNER JOIN `orderSupplierOrders` so ON so.`provider` = e.`provider`
  AND (so.`externalReference` = e.`externalReference`
    OR (e.`providerOrderId` IS NOT NULL AND so.`providerOrderId` = e.`providerOrderId`))
INNER JOIN `orders` o ON o.`id` = so.`orderId`
SET e.`storeId` = o.`storeId`
WHERE e.`storeId` IS NULL;
CREATE INDEX IF NOT EXISTS `supplier_webhook_events_store_provider_state_idx`
  ON `supplierWebhookEvents` (`storeId`, `provider`, `processingState`);

CREATE TABLE IF NOT EXISTS `accountingEntries` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NULL,
  `kind` enum('inventory_purchase','shipping','platform','advertising','payment_fee','other_expense','refund') NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` int NOT NULL,
  `occurredAt` timestamp NOT NULL,
  `supplier` varchar(160),
  `receiptUrl` varchar(500),
  `receiptKey` varchar(500),
  `receiptFileName` varchar(255),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
ALTER TABLE `accountingEntries` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `accountingEntries`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `accountingEntries` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `accounting_entries_store_occurred_idx`
  ON `accountingEntries` (`storeId`, `occurredAt`);

CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NULL,
  `name` varchar(200) NOT NULL,
  `message` varchar(300),
  `startsAt` timestamp NOT NULL,
  `endsAt` timestamp NOT NULL,
  `imageDesktopUrl` varchar(1000),
  `imageMobileUrl` varchar(1000),
  `linkUrl` varchar(1000),
  `promoCode` varchar(64),
  `showCountdown` int NOT NULL DEFAULT 1,
  `placement` enum('announcement','products','both') NOT NULL DEFAULT 'announcement',
  `enabled` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
ALTER TABLE `campaigns` ADD COLUMN IF NOT EXISTS `storeId` int NULL;
UPDATE `campaigns`
SET `storeId` = (SELECT `id` FROM `stores` WHERE `slug` = 'primary-store' LIMIT 1)
WHERE `storeId` IS NULL;
ALTER TABLE `campaigns` MODIFY COLUMN `storeId` int NOT NULL;
CREATE INDEX IF NOT EXISTS `campaigns_store_starts_at_idx`
  ON `campaigns` (`storeId`, `startsAt`);
CREATE INDEX IF NOT EXISTS `campaigns_store_enabled_window_idx`
  ON `campaigns` (`storeId`, `enabled`, `startsAt`, `endsAt`);

-- Stripe/Odoo/CJ credentials and technical settings remain environment-managed.
-- No secret is moved into the database by this migration.
