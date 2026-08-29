-- DropForeignKey
ALTER TABLE `_rolepermissions` DROP FOREIGN KEY `_RolePermissions_A_fkey`;

-- DropForeignKey
ALTER TABLE `_rolepermissions` DROP FOREIGN KEY `_RolePermissions_B_fkey`;

-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_inventoryUnitId_fkey`;

-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_userId_fkey`;

-- DropForeignKey
ALTER TABLE `carouselitem` DROP FOREIGN KEY `CarouselItem_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `commissionpolicy` DROP FOREIGN KEY `CommissionPolicy_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `commissionpolicy` DROP FOREIGN KEY `CommissionPolicy_userId_fkey`;

-- DropForeignKey
ALTER TABLE `commissiontransaction` DROP FOREIGN KEY `CommissionTransaction_bookingId_fkey`;

-- DropForeignKey
ALTER TABLE `commissiontransaction` DROP FOREIGN KEY `CommissionTransaction_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `commissiontransaction` DROP FOREIGN KEY `CommissionTransaction_userId_fkey`;

-- DropForeignKey
ALTER TABLE `inventoryunit` DROP FOREIGN KEY `InventoryUnit_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `layoutelement` DROP FOREIGN KEY `LayoutElement_inventoryUnitId_fkey`;

-- DropForeignKey
ALTER TABLE `layoutelement` DROP FOREIGN KEY `LayoutElement_layoutId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `offer` DROP FOREIGN KEY `Offer_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `projectlayout` DROP FOREIGN KEY `ProjectLayout_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `projectmedia` DROP FOREIGN KEY `ProjectMedia_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `promotionalpopup` DROP FOREIGN KEY `PromotionalPopup_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `Review_reviewRequestId_fkey`;

-- DropForeignKey
ALTER TABLE `reviewrequest` DROP FOREIGN KEY `ReviewRequest_bookingId_fkey`;

-- DropForeignKey
ALTER TABLE `reviewrequest` DROP FOREIGN KEY `ReviewRequest_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `reviewrequest` DROP FOREIGN KEY `ReviewRequest_userId_fkey`;

-- DropForeignKey
ALTER TABLE `sitevisit` DROP FOREIGN KEY `SiteVisit_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `sitevisit` DROP FOREIGN KEY `SiteVisit_userId_fkey`;

-- DropForeignKey
ALTER TABLE `teamrequest` DROP FOREIGN KEY `TeamRequest_proposedParentId_fkey`;

-- DropForeignKey
ALTER TABLE `teamrequest` DROP FOREIGN KEY `TeamRequest_requesterId_fkey`;

-- DropForeignKey
ALTER TABLE `teamrequest` DROP FOREIGN KEY `TeamRequest_targetAssociateId_fkey`;

-- DropForeignKey
ALTER TABLE `teamrequest` DROP FOREIGN KEY `TeamRequest_targetUserId_fkey`;

-- DropForeignKey
ALTER TABLE `tutorialstep` DROP FOREIGN KEY `TutorialStep_tutorialId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_teamId_fkey`;

-- DropTable
DROP TABLE `_rolepermissions`;

-- DropTable
DROP TABLE `auditlog`;

-- DropTable
DROP TABLE `booking`;

-- DropTable
DROP TABLE `carouselitem`;

-- DropTable
DROP TABLE `commissionpolicy`;

-- DropTable
DROP TABLE `commissiontransaction`;

-- DropTable
DROP TABLE `faq`;

-- DropTable
DROP TABLE `inventoryunit`;

-- DropTable
DROP TABLE `layoutelement`;

-- DropTable
DROP TABLE `notification`;

-- DropTable
DROP TABLE `offer`;

-- DropTable
DROP TABLE `permission`;

-- DropTable
DROP TABLE `project`;

-- DropTable
DROP TABLE `projectlayout`;

-- DropTable
DROP TABLE `projectmedia`;

-- DropTable
DROP TABLE `promotionalpopup`;

-- DropTable
DROP TABLE `review`;

-- DropTable
DROP TABLE `reviewrequest`;

-- DropTable
DROP TABLE `role`;

-- DropTable
DROP TABLE `sitevisit`;

-- DropTable
DROP TABLE `team`;

-- DropTable
DROP TABLE `teamrequest`;

-- DropTable
DROP TABLE `tutorial`;

-- DropTable
DROP TABLE `tutorialstep`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `userIdentifier` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `lastLoginAt` DATETIME(3) NULL,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `activeSessionId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `profileImageUrl` VARCHAR(191) NULL,
    `secondaryPhone` VARCHAR(191) NULL,
    `whatsappNumber` VARCHAR(191) NULL,
    `currentAddress` VARCHAR(191) NULL,
    `permanentAddress` VARCHAR(191) NULL,
    `bloodGroup` VARCHAR(191) NULL,
    `socialMedia` JSON NULL,
    `panNumber` VARCHAR(191) NULL,
    `aadhaarNumber` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `ifscCode` VARCHAR(191) NULL,
    `branchName` VARCHAR(191) NULL,
    `emergencyContactName` VARCHAR(191) NULL,
    `emergencyContactRelation` VARCHAR(191) NULL,
    `emergencyContactPhone` VARCHAR(191) NULL,
    `jobTitle` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `workLocation` VARCHAR(191) NULL,
    `dateOfJoining` DATETIME(3) NULL,
    `designation` VARCHAR(191) NULL,
    `commissionPercentage` DOUBLE NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `teamId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_userIdentifier_key`(`userIdentifier`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Permission_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `headUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamRequest` (
    `id` VARCHAR(191) NOT NULL,
    `requesterId` VARCHAR(191) NOT NULL,
    `targetUserId` VARCHAR(191) NOT NULL,
    `proposedParentId` VARCHAR(191) NULL,
    `requestType` VARCHAR(191) NOT NULL,
    `reason` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `location` VARCHAR(191) NOT NULL,
    `projectType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'UNVERIFIED',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isHot` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `developerName` VARCHAR(191) NULL,
    `marketingCompany` VARCHAR(191) NULL,
    `possessionDate` DATETIME(3) NULL,
    `locationDetails` JSON NULL,
    `legalInfo` JSON NULL,
    `landDetails` JSON NULL,
    `pricingInfo` JSON NULL,
    `amenities` JSON NULL,
    `nearbyInfo` JSON NULL,
    `constructionDetails` JSON NULL,
    `marketingInfo` JSON NULL,
    `salesInfo` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectMedia` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `mediaType` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `isCover` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryUnit` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `unitNumber` VARCHAR(191) NOT NULL,
    `propertyType` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NULL,
    `price` DECIMAL(65, 30) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'AVAILABLE',
    `facing` VARCHAR(191) NULL,
    `shape` VARCHAR(191) NULL,
    `area` DOUBLE NULL,
    `roadInformation` VARCHAR(191) NULL,
    `northBoundary` VARCHAR(191) NULL,
    `southBoundary` VARCHAR(191) NULL,
    `eastBoundary` VARCHAR(191) NULL,
    `westBoundary` VARCHAR(191) NULL,
    `towerBlock` VARCHAR(191) NULL,
    `floor` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InventoryUnit_projectId_unitNumber_key`(`projectId`, `unitNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CarouselItem` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `subtitle` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `ctaLabel` VARCHAR(191) NULL,
    `ctaTargetUrl` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromotionalPopup` (
    `id` VARCHAR(191) NOT NULL,
    `heading` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `ctaLabel` VARCHAR(191) NULL,
    `ctaTargetUrl` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
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

-- CreateTable
CREATE TABLE `CommissionPolicy` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
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

    UNIQUE INDEX `CommissionPolicy_userId_projectId_key`(`userId`, `projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommissionTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
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

-- CreateTable
CREATE TABLE `SiteVisit` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `isDemo` BOOLEAN NOT NULL DEFAULT false,
    `visitDate` DATETIME(3) NOT NULL,
    `visitTime` VARCHAR(191) NOT NULL,
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

    INDEX `SiteVisit_userId_idx`(`userId`),
    INDEX `SiteVisit_projectId_idx`(`projectId`),
    INDEX `SiteVisit_visitDate_idx`(`visitDate`),
    INDEX `SiteVisit_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Offer` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `targetAudience` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `targetBookings` INTEGER NULL,
    `reward` TEXT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Offer_targetAudience_idx`(`targetAudience`),
    INDEX `Offer_status_idx`(`status`),
    INDEX `Offer_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReviewRequest` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `requestDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `interactionSummary` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ReviewRequest_token_key`(`token`),
    UNIQUE INDEX `ReviewRequest_bookingId_key`(`bookingId`),
    INDEX `ReviewRequest_userId_idx`(`userId`),
    INDEX `ReviewRequest_status_idx`(`status`),
    INDEX `ReviewRequest_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `reviewRequestId` VARCHAR(191) NOT NULL,
    `overallExperience` INTEGER NOT NULL,
    `communication` INTEGER NOT NULL,
    `propertyExperience` INTEGER NOT NULL,
    `associateSupport` INTEGER NOT NULL,
    `writtenReview` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Review_reviewRequestId_key`(`reviewRequestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `actionUrl` VARCHAR(191) NULL,
    `eventKey` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Notification_userId_idx`(`userId`),
    INDEX `Notification_isRead_idx`(`isRead`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    INDEX `Notification_eventKey_idx`(`eventKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Faq` (
    `id` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `roleVisibility` JSON NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `relatedTutorialSlug` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Faq_category_idx`(`category`),
    INDEX `Faq_isPublished_idx`(`isPublished`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tutorial` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `roleVisibility` JSON NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tutorial_slug_key`(`slug`),
    INDEX `Tutorial_category_idx`(`category`),
    INDEX `Tutorial_isPublished_idx`(`isPublished`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TutorialStep` (
    `id` VARCHAR(191) NOT NULL,
    `tutorialId` VARCHAR(191) NOT NULL,
    `stepNumber` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `explanation` TEXT NOT NULL,
    `targetSelector` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TutorialStep_tutorialId_stepNumber_key`(`tutorialId`, `stepNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectLayout` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL DEFAULT 'v1',
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `canvasWidth` INTEGER NOT NULL DEFAULT 3000,
    `canvasHeight` INTEGER NOT NULL DEFAULT 3000,
    `backgroundImage` VARCHAR(191) NULL,
    `backgroundOpacity` DOUBLE NOT NULL DEFAULT 1.0,
    `gridSize` INTEGER NOT NULL DEFAULT 20,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `publishedBy` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectLayout_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LayoutElement` (
    `id` VARCHAR(191) NOT NULL,
    `layoutId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `inventoryUnitId` VARCHAR(191) NULL,
    `x` DOUBLE NOT NULL,
    `y` DOUBLE NOT NULL,
    `width` DOUBLE NULL,
    `height` DOUBLE NULL,
    `rotation` DOUBLE NOT NULL DEFAULT 0,
    `zIndex` INTEGER NOT NULL DEFAULT 1,
    `elementData` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LayoutElement_layoutId_idx`(`layoutId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_RolePermissions` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_RolePermissions_AB_unique`(`A`, `B`),
    INDEX `_RolePermissions_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamRequest` ADD CONSTRAINT `TeamRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamRequest` ADD CONSTRAINT `TeamRequest_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamRequest` ADD CONSTRAINT `TeamRequest_proposedParentId_fkey` FOREIGN KEY (`proposedParentId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectMedia` ADD CONSTRAINT `ProjectMedia_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryUnit` ADD CONSTRAINT `InventoryUnit_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CarouselItem` ADD CONSTRAINT `CarouselItem_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionalPopup` ADD CONSTRAINT `PromotionalPopup_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_inventoryUnitId_fkey` FOREIGN KEY (`inventoryUnitId`) REFERENCES `InventoryUnit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionPolicy` ADD CONSTRAINT `CommissionPolicy_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionPolicy` ADD CONSTRAINT `CommissionPolicy_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionTransaction` ADD CONSTRAINT `CommissionTransaction_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionTransaction` ADD CONSTRAINT `CommissionTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionTransaction` ADD CONSTRAINT `CommissionTransaction_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisit` ADD CONSTRAINT `SiteVisit_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SiteVisit` ADD CONSTRAINT `SiteVisit_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Offer` ADD CONSTRAINT `Offer_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewRequest` ADD CONSTRAINT `ReviewRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewRequest` ADD CONSTRAINT `ReviewRequest_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewRequest` ADD CONSTRAINT `ReviewRequest_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_reviewRequestId_fkey` FOREIGN KEY (`reviewRequestId`) REFERENCES `ReviewRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TutorialStep` ADD CONSTRAINT `TutorialStep_tutorialId_fkey` FOREIGN KEY (`tutorialId`) REFERENCES `Tutorial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectLayout` ADD CONSTRAINT `ProjectLayout_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LayoutElement` ADD CONSTRAINT `LayoutElement_layoutId_fkey` FOREIGN KEY (`layoutId`) REFERENCES `ProjectLayout`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LayoutElement` ADD CONSTRAINT `LayoutElement_inventoryUnitId_fkey` FOREIGN KEY (`inventoryUnitId`) REFERENCES `InventoryUnit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RolePermissions` ADD CONSTRAINT `_RolePermissions_A_fkey` FOREIGN KEY (`A`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RolePermissions` ADD CONSTRAINT `_RolePermissions_B_fkey` FOREIGN KEY (`B`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

