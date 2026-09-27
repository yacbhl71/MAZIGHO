-- Stripe Connect Direct Charges — isolated Production account references.
--
-- This migration only provides tenant-scoped storage for opaque `acct_...`
-- identifiers and Stripe capability flags. It never inserts an account, reads
-- banking data, changes a shop status, or opens a real payment by itself.

CREATE TABLE IF NOT EXISTS `stripeLiveConnectedAccounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `stripeAccountId` varchar(255) NOT NULL,
  `mode` enum('live') NOT NULL DEFAULT 'live',
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
  UNIQUE KEY `stripe_live_connected_accounts_store_unique` (`storeId`),
  UNIQUE KEY `stripe_live_connected_accounts_account_unique` (`stripeAccountId`)
);
