-- DropIndex
DROP INDEX `User_employeeId_key` ON `user`;

-- AlterTable: Rename employeeId to associateId and add new fields
ALTER TABLE `user` CHANGE COLUMN `employeeId` `associateId` VARCHAR(191) NULL,
    ADD COLUMN `aadhaarNumber` VARCHAR(191) NULL,
    ADD COLUMN `accountNumber` VARCHAR(191) NULL,
    ADD COLUMN `activeSessionId` VARCHAR(191) NULL,
    ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `approvedBy` VARCHAR(191) NULL,
    ADD COLUMN `bankName` VARCHAR(191) NULL,
    ADD COLUMN `bloodGroup` VARCHAR(191) NULL,
    ADD COLUMN `branchName` VARCHAR(191) NULL,
    ADD COLUMN `commissionPercentage` DOUBLE NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `currentAddress` VARCHAR(191) NULL,
    ADD COLUMN `dateOfJoining` DATETIME(3) NULL,
    ADD COLUMN `department` VARCHAR(191) NULL,
    ADD COLUMN `emergencyContactName` VARCHAR(191) NULL,
    ADD COLUMN `emergencyContactPhone` VARCHAR(191) NULL,
    ADD COLUMN `emergencyContactRelation` VARCHAR(191) NULL,
    ADD COLUMN `ifscCode` VARCHAR(191) NULL,
    ADD COLUMN `jobTitle` VARCHAR(191) NULL,
    ADD COLUMN `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `panNumber` VARCHAR(191) NULL,
    ADD COLUMN `permanentAddress` VARCHAR(191) NULL,
    ADD COLUMN `rejectionReason` VARCHAR(191) NULL,
    ADD COLUMN `secondaryPhone` VARCHAR(191) NULL,
    ADD COLUMN `socialMedia` JSON NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `whatsappNumber` VARCHAR(191) NULL,
    ADD COLUMN `workLocation` VARCHAR(191) NULL;

-- Migrate Status
UPDATE `user` SET `status` = 'DEACTIVATED' WHERE `isActive` = false;
UPDATE `user` SET `status` = 'ACTIVE' WHERE `isActive` = true;

-- Assign Secure Generated IDs
UPDATE `user` SET `associateId` = 'ASSOC-MD-4056' WHERE `id` = '17851068-285f-4a7e-9930-5338574c0a1c';
UPDATE `user` SET `associateId` = 'ASSOC-RS-6865' WHERE `id` = '423d581d-dba8-49ab-b193-3403cac3847b';
UPDATE `user` SET `associateId` = 'ASSOC-RS-3165' WHERE `id` = 'ecd319a9-e943-4f27-a193-71b0a9aad0f5';
UPDATE `user` SET `associateId` = 'ASSOC-MN-8900' WHERE `id` = 'f202f8dc-700c-4119-a344-2cdede48ba15';


-- Drop isActive
ALTER TABLE `user` DROP COLUMN `isActive`;

-- CreateIndex
CREATE UNIQUE INDEX `User_associateId_key` ON `User`(`associateId`);
