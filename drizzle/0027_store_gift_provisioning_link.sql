-- Gift-store provisioning trace.
-- These nullable fields remain empty until an operator explicitly creates a store.
-- The migration itself creates no store, account, invitation, payment or license.

ALTER TABLE `storeProvisioningDrafts` ADD COLUMN IF NOT EXISTS `provisionedStoreId` int NULL;
ALTER TABLE `storeProvisioningDrafts` ADD COLUMN IF NOT EXISTS `provisionedAt` timestamp NULL;
CREATE INDEX IF NOT EXISTS `store_provisioning_drafts_provisioned_store_idx` ON `storeProvisioningDrafts` (`provisionedStoreId`);
