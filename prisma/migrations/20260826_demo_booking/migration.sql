-- CreateTable
CREATE TABLE `DemoBooking` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `scheduledDate` DATETIME(3) NOT NULL,
    `scheduledTime` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SCHEDULED',
    `outcome` TEXT NULL,
    `followUpRequired` BOOLEAN NOT NULL DEFAULT false,
    `followUpDate` DATETIME(3) NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `rescheduledAt` DATETIME(3) NULL,

    INDEX `DemoBooking_userId_idx`(`userId`),
    INDEX `DemoBooking_projectId_idx`(`projectId`),
    INDEX `DemoBooking_scheduledDate_idx`(`scheduledDate`),
    INDEX `DemoBooking_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DemoBooking` ADD CONSTRAINT `DemoBooking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DemoBooking` ADD CONSTRAINT `DemoBooking_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

