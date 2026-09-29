-- Editable, store-scoped category copy used by the public category page.
-- Existing categories retain their current presentation through the UI fallbacks.
ALTER TABLE `categories`
  ADD COLUMN IF NOT EXISTS `publicNotice` text NULL,
  ADD COLUMN IF NOT EXISTS `emptyStateMessage` text NULL;
