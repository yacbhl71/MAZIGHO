CREATE TABLE IF NOT EXISTS `productCategories` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `productId` int NOT NULL,
  `categoryId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `product_categories_product_category_unique` (`productId`, `categoryId`),
  INDEX `product_categories_product_idx` (`productId`),
  INDEX `product_categories_category_idx` (`categoryId`)
);

INSERT IGNORE INTO `productCategories` (`productId`, `categoryId`)
SELECT `id`, `categoryId` FROM `products`;
