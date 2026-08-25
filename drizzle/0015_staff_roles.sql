ALTER TABLE `users`
  MODIFY COLUMN `role` enum('user', 'catalog_editor', 'support_agent', 'order_operator', 'admin') NOT NULL DEFAULT 'user';
