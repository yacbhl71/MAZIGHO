-- Seller-side operational tracking for a return, refund or dispute case.
-- No card, bank account, API key, provider payload or payment mutation is stored.
ALTER TABLE `returnRequests` ADD COLUMN IF NOT EXISTS `externalCaseType` enum('none','refund','dispute','other') NOT NULL DEFAULT 'none';
ALTER TABLE `returnRequests` ADD COLUMN IF NOT EXISTS `externalCaseStatus` enum('not_started','action_required','submitted','resolved') NOT NULL DEFAULT 'not_started';
ALTER TABLE `returnRequests` ADD COLUMN IF NOT EXISTS `externalCaseProvider` enum('not_specified','stripe','chargily','carrier','other') NOT NULL DEFAULT 'not_specified';
ALTER TABLE `returnRequests` ADD COLUMN IF NOT EXISTS `externalCaseReference` varchar(120) NULL;
ALTER TABLE `returnRequests` ADD COLUMN IF NOT EXISTS `externalCaseDeadlineAt` timestamp NULL;
ALTER TABLE `returnRequests` ADD COLUMN IF NOT EXISTS `externalCaseNote` varchar(1000) NULL;
CREATE INDEX `return_requests_store_case_status_idx` ON `returnRequests` (`storeId`, `externalCaseStatus`, `updatedAt`);
