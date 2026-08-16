-- CreateTable
CREATE TABLE `Booking` (
    `id` VARCHAR(191) NOT NULL,
    `associateId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `inventoryUnitId` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `alternatePhone` VARCHAR(191) NULL,
    `customerEmail` VARCHAR(191) NULL,
    `customerAddress` TEXT NULL,
    `preferredLocation` VARCHAR(191) NULL,
    `bookingDate` DATETIME(3) NOT NULL,
    `expectedAmount` DECIMAL(65, 30) NOT NULL,
    `paymentMode` VARCHAR(191) NOT NULL,
    `bookingAmount` DECIMAL(65, 30) NOT NULL,
    `notes` TEXT NULL,
    `documents` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SUBMITTED',
    `verifiedBy` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Booking_inventoryUnitId_key`(`inventoryUnitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actor` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `beforeJson` JSON NULL,
    `afterJson` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_associateId_fkey` FOREIGN KEY (`associateId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_inventoryUnitId_fkey` FOREIGN KEY (`inventoryUnitId`) REFERENCES `InventoryUnit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
