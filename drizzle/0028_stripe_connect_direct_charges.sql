-- Stripe Connect Direct Charges foundation.
-- Test-only account references are tenant-scoped. No live key, bank detail,
-- connected-account token, subscription or payment is created by this migration.

CREATE TABLE IF NOT EXISTS `stripeConnectedAccounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `stripeAccountId` varchar(255) NOT NULL,
  `mode` enum('test') NOT NULL DEFAULT 'test',
  `accountType` enum('express') NOT NULL DEFAULT 'express',
  `status` enum('created','onboarding','active','restricted') NOT NULL DEFAULT 'created',
  `onboardingComplete` int NOT NULL DEFAULT 0,
  `chargesEnabled` int NOT NULL DEFAULT 0,
  `payoutsEnabled` int NOT NULL DEFAULT 0,
  `detailsSubmitted` int NOT NULL DEFAULT 0,
  `lastCheckedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stripe_connected_accounts_store_unique` (`storeId`),
  UNIQUE KEY `stripe_connected_accounts_account_unique` (`stripeAccountId`)
);

ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `stripeConnectedAccountId` varchar(255) NULL;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `stripePaymentIntentId` varchar(255) NULL;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `stripeApplicationFeeAmount` int NOT NULL DEFAULT 0;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `stripeCommissionRateBps` int NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS `orders_store_connect_account_idx` ON `orders` (`storeId`, `stripeConnectedAccountId`);
