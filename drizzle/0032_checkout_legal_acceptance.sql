-- Checkout legal acceptance evidence.
--
-- These fields are deliberately nullable for pre-existing orders. New Stripe
-- Checkout orders must populate all three fields atomically with their stock
-- reservation; no customer-provided legal text is stored.
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `legalAcceptanceVersion` varchar(64);
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `legalAcceptedAt` timestamp NULL;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `legalAcceptanceSnapshot` text;
