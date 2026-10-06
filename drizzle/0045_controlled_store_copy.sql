-- Controlled source-store copy provenance.
-- The destination remains a separately provisioned tenant; this only records
-- the selected source id and bounded scope choices for the explicit copy step.
ALTER TABLE `storeProvisioningDrafts`
  ADD COLUMN IF NOT EXISTS `copySourceStoreId` int NULL AFTER `requestedPlan`;
ALTER TABLE `storeProvisioningDrafts`
  ADD COLUMN IF NOT EXISTS `copySelection` text NULL AFTER `copySourceStoreId`;
CREATE INDEX IF NOT EXISTS `store_provisioning_drafts_copy_source_idx`
  ON `storeProvisioningDrafts` (`copySourceStoreId`);
