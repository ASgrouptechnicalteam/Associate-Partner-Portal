-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_associateId_fkey`;

-- DropForeignKey
ALTER TABLE `commissionpolicy` DROP FOREIGN KEY `CommissionPolicy_associateId_fkey`;

-- DropForeignKey
ALTER TABLE `commissiontransaction` DROP FOREIGN KEY `CommissionTransaction_associateId_fkey`;

-- Ignored layout foreign keys to prevent shadow DB failure

-- DropForeignKey
ALTER TABLE `reviewrequest` DROP FOREIGN KEY `ReviewRequest_associateId_fkey`;

-- DropForeignKey
ALTER TABLE `sitevisit` DROP FOREIGN KEY `SiteVisit_associateId_fkey`;

-- Ignored other foreign keys to prevent shadow DB failure

-- DropIndex
DROP INDEX `CommissionPolicy_associateId_projectId_key` ON `commissionpolicy`;

-- DropIndex
DROP INDEX `User_associateId_key` ON `user`;

-- AlterTable
ALTER TABLE `booking` CHANGE COLUMN `associateId` `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `commissionpolicy` CHANGE COLUMN `associateId` `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `commissiontransaction` CHANGE COLUMN `associateId` `userId` VARCHAR(191) NOT NULL;

-- Ignored layoutType drop

-- AlterTable
ALTER TABLE `reviewrequest` CHANGE COLUMN `associateId` `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `sitevisit` CHANGE COLUMN `associateId` `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `teamrequest` CHANGE COLUMN `targetAssociateId` `targetUserId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` CHANGE COLUMN `associateId` `userIdentifier` VARCHAR(191) NULL;
ALTER TABLE `user` ADD COLUMN `designation` VARCHAR(191) NULL,
    ADD COLUMN `parentId` VARCHAR(191) NULL,
    ADD COLUMN `teamId` VARCHAR(191) NULL;

-- Data Migration: ASSOC-RS-XXXX to RS-XXXX
UPDATE `user` SET `userIdentifier` = REPLACE(`userIdentifier`, 'ASSOC-', '') WHERE `userIdentifier` LIKE 'ASSOC-%';


-- DropTable
DROP TABLE IF EXISTS `layoutbuilding`;

-- DropTable
DROP TABLE IF EXISTS `layoutfloor`;

-- DropTable
DROP TABLE IF EXISTS `layoutlayer`;

-- DropTable
DROP TABLE IF EXISTS `layoutobject`;

-- DropTable
DROP TABLE IF EXISTS `layoutunit`;

-- DropTable
DROP TABLE IF EXISTS `teamrelationship`;

-- DropTable
DROP TABLE IF EXISTS `travelrequest`;

-- CreateTable
CREATE TABLE `Team` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `headUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `CommissionPolicy_userId_projectId_key` ON `CommissionPolicy`(`userId`, `projectId`);

-- CreateIndex
CREATE INDEX `ReviewRequest_userId_idx` ON `ReviewRequest`(`userId`);

-- CreateIndex
CREATE INDEX `SiteVisit_userId_idx` ON `SiteVisit`(`userId`);

-- CreateIndex
CREATE UNIQUE INDEX `User_userIdentifier_key` ON `User`(`userIdentifier`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamRequest` ADD CONSTRAINT `TeamRequest_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionPolicy` ADD CONSTRAINT `CommissionPolicy_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionTransaction` ADD CONSTRAINT `CommissionTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisit` ADD CONSTRAINT `SiteVisit_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewRequest` ADD CONSTRAINT `ReviewRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

