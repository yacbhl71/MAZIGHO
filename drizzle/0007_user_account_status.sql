ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `accountStatus` enum('active', 'blocked') NOT NULL DEFAULT 'active';
