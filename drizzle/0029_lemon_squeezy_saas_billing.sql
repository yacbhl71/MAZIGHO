-- Lemon Squeezy bills MAZIGHO's SaaS offers to boutique owners.
-- This is intentionally isolated from storefront customer checkout and Stripe
-- Connect. The tables store only opaque provider IDs and state, never API
-- keys, card data, customer PII, webhook bodies or signed portal URLs.

CREATE TABLE IF NOT EXISTS `lemonSqueezyBillingCheckouts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `checkoutNonce` varchar(160) NOT NULL,
  `planId` varchar(40) NOT NULL,
  `mode` enum('test') NOT NULL DEFAULT 'test',
  `status` enum('created','paid','void') NOT NULL DEFAULT 'created',
  `lemonCheckoutId` varchar(120) NULL,
  `lemonOrderId` varchar(120) NULL,
  `paidAt` timestamp NULL,
  `expiresAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lemon_squeezy_billing_checkout_nonce_unique` (`checkoutNonce`),
  UNIQUE KEY `lemon_squeezy_billing_checkout_order_unique` (`lemonOrderId`),
  KEY `lemon_squeezy_billing_checkout_store_status_created_idx` (`storeId`, `status`, `createdAt`)
);

CREATE TABLE IF NOT EXISTS `lemonSqueezySubscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `lemonSubscriptionId` varchar(120) NOT NULL,
  `lemonOrderId` varchar(120) NULL,
  `planId` varchar(40) NOT NULL,
  `mode` enum('test') NOT NULL DEFAULT 'test',
  `status` enum('on_trial','active','paused','past_due','unpaid','cancelled','expired') NOT NULL,
  `renewsAt` timestamp NULL,
  `endsAt` timestamp NULL,
  `lastEventAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lemon_squeezy_subscription_store_unique` (`storeId`),
  UNIQUE KEY `lemon_squeezy_subscription_id_unique` (`lemonSubscriptionId`),
  KEY `lemon_squeezy_subscription_status_idx` (`status`, `updatedAt`)
);

CREATE TABLE IF NOT EXISTS `lemonSqueezyWebhookEvents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bodyHash` varchar(64) NOT NULL,
  `eventName` varchar(80) NOT NULL,
  `resourceType` varchar(40) NULL,
  `resourceId` varchar(120) NULL,
  `storeId` int NULL,
  `status` enum('processing','processed','failed') NOT NULL DEFAULT 'processing',
  `processedAt` timestamp NULL,
  `failureCode` varchar(120) NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lemon_squeezy_webhook_body_hash_unique` (`bodyHash`),
  KEY `lemon_squeezy_webhook_store_created_idx` (`storeId`, `createdAt`)
);
