-- Documents et modèles privés du MAZIGHO Workspace.
-- Le titre et le contenu sont chiffrés côté application avant insertion.
CREATE TABLE IF NOT EXISTS `ownerAiWorkspaceDocuments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NOT NULL,
  `kind` enum('document', 'template') NOT NULL DEFAULT 'document',
  `titleCiphertext` text NOT NULL,
  `titleIv` varchar(48) NOT NULL,
  `contentCiphertext` mediumtext NOT NULL,
  `contentIv` varchar(48) NOT NULL,
  `createdByUserId` int NOT NULL,
  `updatedByUserId` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `owner_ai_workspace_documents_store_kind_updated_idx` (`storeId`, `kind`, `updatedAt`)
);
