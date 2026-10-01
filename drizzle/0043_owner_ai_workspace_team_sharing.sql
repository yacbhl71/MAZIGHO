-- Collaboration Workspace : partage explicite, en lecture seule, par boutique.
ALTER TABLE `ownerAiWorkspaceDocuments`
  ADD COLUMN IF NOT EXISTS `visibility` enum('private', 'team') NOT NULL DEFAULT 'private';
