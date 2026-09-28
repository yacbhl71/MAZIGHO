-- Records the reusable Studio template selected before a boutique is created.
-- The operational Algeria settings themselves remain isolated per store.
ALTER TABLE `storeProvisioningDrafts`
  ADD COLUMN IF NOT EXISTS `provisioningTemplate` varchar(32) NOT NULL DEFAULT 'standard';
