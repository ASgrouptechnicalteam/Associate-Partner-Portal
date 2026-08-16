-- DropIndex
DROP INDEX `User_employeeId_key` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `employeeId`,
    DROP COLUMN `isActive`,
    ADD COLUMN `aadhaarNumber` VARCHAR(191) NULL,
    ADD COLUMN `accountNumber` VARCHAR(191) NULL,
    ADD COLUMN `activeSessionId` VARCHAR(191) NULL,
    ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `approvedBy` VARCHAR(191) NULL,
    ADD COLUMN `associateId` VARCHAR(191) NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX `User_associateId_key` ON `User`(`associateId`);
