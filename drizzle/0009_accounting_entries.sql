CREATE TABLE IF NOT EXISTS `accountingEntries` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `kind` enum('inventory_purchase', 'shipping', 'platform', 'advertising', 'payment_fee', 'other_expense', 'refund') NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` int NOT NULL,
  `occurredAt` timestamp NOT NULL,
  `supplier` varchar(160),
  `receiptUrl` varchar(500),
  `receiptKey` varchar(500),
  `receiptFileName` varchar(255),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
