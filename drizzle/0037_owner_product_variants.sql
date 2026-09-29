-- Durable owner-managed product variants for stock and price by option.
-- This matches drizzle/schema.ts and replaces legacy runtime table creation
-- with a versioned deployment-time migration.
CREATE TABLE IF NOT EXISTS `ownerProductVariants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `storeId` int NOT NULL,
  `productId` int NOT NULL,
  `label` varchar(160) NOT NULL,
  `sku` varchar(100) NULL,
  `priceAdjustmentCents` int NOT NULL DEFAULT 0,
  `stock` int NOT NULL DEFAULT 0,
  `status` enum('active', 'inactive') NOT NULL DEFAULT 'active',
  `displayOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `owner_product_variants_store_product_label_unique` (`storeId`, `productId`, `label`),
  KEY `owner_product_variants_store_product_order_idx` (`storeId`, `productId`, `displayOrder`)
);
