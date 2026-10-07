-- Badge public explicite : la date de création ne peut plus marquer automatiquement un produit comme « Nouveau ».
ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `showNewBadge` int NOT NULL DEFAULT 0;
