import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateNotificationDTO {
  userId: string;
  category: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  eventKey?: string;
}

export class NotificationService {
  /**
   * Safely creates a single notification, preventing duplicates if eventKey is provided.
   * Can be used within an existing Prisma transaction to ensure atomicity.
   */
  static async createNotification(
    data: CreateNotificationDTO,
    tx?: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
  ) {
    const db = tx || prisma;

    if (data.eventKey) {
      // Duplicate prevention using deterministic eventKey + userId
      const existing = await db.notification.findFirst({
        where: {
          userId: data.userId,
          eventKey: data.eventKey
        }
      });

      if (existing) {
        console.log(`Notification already exists for eventKey: ${data.eventKey} and user: ${data.userId}`);
        return existing;
      }
    }

    return db.notification.create({
      data: {
        userId: data.userId,
        category: data.category,
        title: data.title,
        message: data.message,
        entityType: data.entityType,
        entityId: data.entityId,
        actionUrl: data.actionUrl,
        eventKey: data.eventKey,
        isRead: false
      }
    });
  }

  /**
   * Safely creates multiple notifications, preventing duplicates if eventKey is provided.
   * Can be used within an existing Prisma transaction to ensure atomicity.
   */
  static async createNotifications(
    dataArray: CreateNotificationDTO[],
    tx?: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
  ) {
    const db = tx || prisma;
    const createdNotifications = [];

    for (const data of dataArray) {
      const notification = await this.createNotification(data, db);
      createdNotifications.push(notification);
    }

    return createdNotifications;
  }

  /**
   * Retrieves a paginated list of notifications for a specific user.
   */
  static async listForUser(userId: string, options: { page?: number; limit?: number; category?: string; isRead?: boolean } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      isDismissed: false
    };

    if (options.category) {
      where.category = options.category;
    }
    
    if (options.isRead !== undefined) {
      where.isRead = options.isRead;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Gets the unread notification count for a specific user.
   */
  static async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
        isDismissed: false
      }
    });
    return { count };
  }

  /**
   * Marks a single notification as read, ensuring it belongs to the authenticated user.
   */
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Forbidden'); // IDOR protection
    }

    if (notification.isRead) {
      return notification; // Already read
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Dismisses a single notification, hiding it from the active UI list.
   * Ensures it belongs to the authenticated user.
   */
  static async dismiss(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new Error('Forbidden'); // IDOR protection
    }

    if (notification.isDismissed) {
      return notification;
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isDismissed: true
      }
    });
  }

  /**
   * Marks all unread notifications for a specific user as read.
   */
  static async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return { count: result.count };
  }
}
