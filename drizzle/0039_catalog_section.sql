-- Durable deployment migration for tenant catalogue category writes.
-- The column existed in the Drizzle schema but older production databases may
-- predate the original catalog-section migration.
ALTER TABLE `categories`
  ADD COLUMN IF NOT EXISTS `catalogSection` enum('standard','creations') NOT NULL DEFAULT 'standard';
