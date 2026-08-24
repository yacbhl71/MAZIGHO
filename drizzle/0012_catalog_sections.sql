ALTER TABLE `categories`
  ADD COLUMN IF NOT EXISTS `catalogSection` enum('standard','creations') NOT NULL DEFAULT 'standard';
