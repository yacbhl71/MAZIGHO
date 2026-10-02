-- Public acquisition intent only. It never grants plan entitlements or triggers billing.
ALTER TABLE `storeProvisioningDrafts`
  ADD COLUMN IF NOT EXISTS `requestedPlan` varchar(16) NULL AFTER `preferredCurrency`;
