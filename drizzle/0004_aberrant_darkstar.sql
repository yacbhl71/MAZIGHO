CREATE TABLE `promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`type` enum('percent','fixed') NOT NULL DEFAULT 'percent',
	`value` int NOT NULL,
	`minOrderAmount` int,
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`active` int NOT NULL DEFAULT 1,
	`startsAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`),
	CONSTRAINT `promotions_code_unique` UNIQUE(`code`)
);
