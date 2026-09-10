-- Sixth multi-store phase: operator-only provisioning drafts.
-- A draft records a future storefront proposal only. It does not create a store,
-- resolve a domain, create a membership, send an invitation or enable billing.

CREATE TABLE IF NOT EXISTS `storeProvisioningDrafts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `displayName` varchar(160) NOT NULL,
  `requestedDomain` varchar(255) NOT NULL,
  `ownerName` varchar(160) NOT NULL,
  `ownerEmail` varchar(320) NOT NULL,
  `businessType` enum('animalier','bijoux','vetements','autre') NOT NULL DEFAULT 'autre',
  `preferredCurrency` varchar(3) NOT NULL DEFAULT 'CHF',
  `status` enum('draft','ready_for_confirmation','archived') NOT NULL DEFAULT 'draft',
  `notes` text,
  `createdByUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `store_provisioning_drafts_status_updated_idx` (`status`, `updatedAt`),
  KEY `store_provisioning_drafts_domain_idx` (`requestedDomain`)
);
