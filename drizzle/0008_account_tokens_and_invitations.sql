ALTER TABLE `users`
  MODIFY COLUMN `accountStatus` enum('pending_invitation', 'active', 'blocked') NOT NULL DEFAULT 'active';

ALTER TABLE `users`
  MODIFY COLUMN `lastSignedIn` timestamp NULL DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `accountTokens` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `purpose` enum('account_invitation', 'password_reset') NOT NULL,
  `tokenHash` varchar(64) NOT NULL UNIQUE,
  `expiresAt` timestamp NOT NULL,
  `usedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
