-- Explicit operator-selected payment route for a new store. This stores only
-- the intended setup path; it contains no payment credential and enables nothing.
ALTER TABLE `storeProvisioningDrafts`
  ADD COLUMN IF NOT EXISTS `paymentRoute` varchar(32) NOT NULL DEFAULT 'stripe_connect';
