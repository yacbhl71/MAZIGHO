ALTER TABLE `orders`
  ADD COLUMN `stripeSessionId` varchar(255) NULL;

CREATE UNIQUE INDEX `orders_stripe_session_id_unique`
  ON `orders` (`stripeSessionId`);
