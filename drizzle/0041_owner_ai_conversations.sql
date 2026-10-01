-- Conversations IA privées par boutique.
-- Les titres et messages sont chiffrés côté application avant insertion.
CREATE TABLE IF NOT EXISTS `ownerAiConversations` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NOT NULL,
  `titleCiphertext` text NOT NULL,
  `titleIv` varchar(48) NOT NULL,
  `createdByUserId` int NOT NULL,
  `messageCount` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `owner_ai_conversations_store_updated_idx` (`storeId`, `updatedAt`)
);

CREATE TABLE IF NOT EXISTS `ownerAiConversationMessages` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `storeId` int NOT NULL,
  `conversationId` int NOT NULL,
  `role` enum('user', 'assistant') NOT NULL,
  `contentCiphertext` mediumtext NOT NULL,
  `contentIv` varchar(48) NOT NULL,
  `characterCount` int NOT NULL,
  `createdByUserId` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `owner_ai_conversation_messages_conversation_idx` (`conversationId`, `id`),
  INDEX `owner_ai_conversation_messages_store_idx` (`storeId`, `createdAt`)
);
