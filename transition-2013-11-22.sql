ALTER TABLE `Users`
  ADD COLUMN `private` tinyint(1) NOT NULL DEFAULT '0' AFTER secret
  ADD COLUMN `OfficeId` int(11) DEFAULT NULL AFTER updatedAt;

UPDATE Users SET OfficeId = 1 WHERE OfficeId IS NULL;

ALTER TABLE `Stats` MODIFY COLUMN `date` date DEFAULT NULL;
