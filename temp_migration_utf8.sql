-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_associateId_fkey`;

-- DropForeignKey
ALTER TABLE `commissionpolicy` DROP FOREIGN KEY `CommissionPolicy_associateId_fkey`;

-- DropForeignKey
ALTER TABLE `commissiontransaction` DROP FOREIGN KEY `CommissionTransaction_associateId_fkey`;

-- DropForeignKey
ALTER TABLE `layoutbuilding` DROP FOREIGN KEY `LayoutBuilding_layoutId_fkey`;

-- DropForeignKey
ALTER TABLE `layoutfloor` DROP FOREIGN KEY `LayoutFloor_buildingId_fkey`;

-- DropForeignKey
ALTER TABLE `layoutlayer` DROP FOREIGN KEY `LayoutLayer_layoutId_fkey`;

-- DropForeignKey
ALTER TABLE `layoutobject` DROP FOREIGN KEY `LayoutObject_inventoryUnitId_fkey`;

-- DropForeignKey
ALTER TABLE `layoutobject` DROP FOREIGN KEY `LayoutObject_layerId_fkey`;

-- DropForeignKey
ALTER TABLE `layoutobject` DROP FOREIGN KEY `LayoutObject_layoutId_fkey`;

-- DropForeignKey
ALTER TABLE `layoutunit` DROP FOREIGN KEY `LayoutUnit_floorId_fkey`;

-- DropForeignKey
ALTER TABLE `layoutunit` DROP FOREIGN KEY `LayoutUnit_inventoryUnitId_fkey`;

-- DropForeignKey
ALTER TABLE `reviewrequest` DROP FOREIGN KEY `ReviewRequest_associateId_fkey`;

-- DropForeignKey
ALTER TABLE `sitevisit` DROP FOREIGN KEY `SiteVisit_associateId_fkey`;

-- DropForeignKey
ALTER TABLE `teamrelationship` DROP FOREIGN KEY `TeamRelationship_childAssociateId_fkey`;

-- DropForeignKey
ALTER TABLE `teamrelationship` DROP FOREIGN KEY `TeamRelationship_parentAssociateId_fkey`;

-- DropForeignKey
ALTER TABLE `teamrequest` DROP FOREIGN KEY `TeamRequest_targetAssociateId_fkey`;

-- DropForeignKey
ALTER TABLE `travelrequest` DROP FOREIGN KEY `TravelRequest_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `travelrequest` DROP FOREIGN KEY `TravelRequest_requesterId_fkey`;

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

-- AlterTable
ALTER TABLE `projectlayout` DROP COLUMN `layoutType`;

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
DROP TABLE `layoutbuilding`;

-- DropTable
DROP TABLE `layoutfloor`;

-- DropTable
DROP TABLE `layoutlayer`;

-- DropTable
DROP TABLE `layoutobject`;

-- DropTable
DROP TABLE `layoutunit`;

-- DropTable
DROP TABLE `teamrelationship`;

-- DropTable
DROP TABLE `travelrequest`;

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

