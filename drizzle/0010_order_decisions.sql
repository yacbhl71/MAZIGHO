CREATE TABLE IF NOT EXISTS `orderDecisions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `orderId` int NOT NULL,
  `action` enum('accepted','rejected','refund_requested') NOT NULL,
  `reason` varchar(500),
  `actorUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `orderDecisions_order_idx` (`orderId`)
);
