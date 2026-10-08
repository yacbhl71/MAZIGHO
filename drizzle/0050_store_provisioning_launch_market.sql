-- Operator-selected storefront market profile only. No payment, tax, carrier,
-- legal identity, customer, supplier or secret data is introduced by this column.
ALTER TABLE `storeProvisioningDrafts`
  ADD COLUMN IF NOT EXISTS `launchMarket` varchar(32) NOT NULL DEFAULT 'custom';
