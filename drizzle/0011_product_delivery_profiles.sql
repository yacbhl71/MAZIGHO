CREATE TABLE IF NOT EXISTS `productDeliveryProfiles` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `productId` int NOT NULL,
  `countryCode` varchar(2) NOT NULL,
  `supplierVariantId` varchar(128),
  `supplierShippingCost` int NOT NULL,
  `customerShippingCost` int NOT NULL,
  `deliveryMethod` varchar(255),
  `minDeliveryDays` int,
  `maxDeliveryDays` int,
  `quotedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `delivery_profile_product_country_idx` (`productId`, `countryCode`)
);
