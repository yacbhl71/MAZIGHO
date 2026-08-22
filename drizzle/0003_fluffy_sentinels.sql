ALTER TABLE `products` ADD COLUMN `supplier` varchar(32);
--> statement-breakpoint
ALTER TABLE `products` ADD COLUMN `supplierProductId` varchar(128);
--> statement-breakpoint
ALTER TABLE `products` ADD COLUMN `supplierUrl` varchar(1000);
--> statement-breakpoint
ALTER TABLE `products` ADD COLUMN `supplierPrice` int;
--> statement-breakpoint
ALTER TABLE `products` ADD COLUMN `lastSyncedAt` timestamp;
