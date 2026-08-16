-- CreateTable
CREATE TABLE `CommissionPolicy` (
    `id` VARCHAR(191) NOT NULL,
    `associateId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `value` DECIMAL(65, 30) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_APPROVAL',
    `createdBy` VARCHAR(191) NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CommissionPolicy_associateId_projectId_key`(`associateId`, `projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommissionTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `associateId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `commissionType` VARCHAR(191) NOT NULL,
    `commissionValue` DECIMAL(65, 30) NOT NULL,
    `baseAmount` DECIMAL(65, 30) NOT NULL,
    `amountCalculated` DECIMAL(65, 30) NOT NULL,
    `amountReceived` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `amountDue` DECIMAL(65, 30) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CommissionTransaction_bookingId_key`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CommissionPolicy` ADD CONSTRAINT `CommissionPolicy_associateId_fkey` FOREIGN KEY (`associateId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionPolicy` ADD CONSTRAINT `CommissionPolicy_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionTransaction` ADD CONSTRAINT `CommissionTransaction_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionTransaction` ADD CONSTRAINT `CommissionTransaction_associateId_fkey` FOREIGN KEY (`associateId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionTransaction` ADD CONSTRAINT `CommissionTransaction_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
