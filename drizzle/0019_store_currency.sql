ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `totalAmountChf` int NOT NULL DEFAULT 0;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `currencyCode` varchar(3) NOT NULL DEFAULT 'CHF';
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `currencyRateBps` int NOT NULL DEFAULT 10000;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `customerShippingAmountChf` int NOT NULL DEFAULT 0;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `discountAmountChf` int NOT NULL DEFAULT 0;
ALTER TABLE `orderItems` ADD COLUMN IF NOT EXISTS `priceAtPurchaseChf` int NOT NULL DEFAULT 0;

-- Every pre-existing MAZIGHO order was charged in CHF.
UPDATE `orders`
SET `totalAmountChf` = `totalAmount`
WHERE `currencyCode` = 'CHF' AND `totalAmountChf` = 0 AND `totalAmount` <> 0;

UPDATE `orderItems`
SET `priceAtPurchaseChf` = `priceAtPurchase`
WHERE `priceAtPurchaseChf` = 0 AND `priceAtPurchase` <> 0;
