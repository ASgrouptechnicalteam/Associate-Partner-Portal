import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
  static async log(actor: string, action: string, entity: string, entityId: string, beforeJson?: any, afterJson?: any, metadata?: any) {
    try {
      await prisma.auditLog.create({
        data: {
          actor,
          action,
          entity,
          entityId,
          beforeJson: beforeJson || null,
          afterJson: afterJson || null,
          metadata: metadata || null
        }
      });
    } catch (error) {
      console.error('AuditLog creation failed:', error);
      // We shouldn't fail the main transaction if the audit log fails, unless strictly required.
      // But in a real system, we'd log this critical error.
    }
  }

  // Transaction-aware log function
  static logWithTx(tx: any, actor: string, action: string, entity: string, entityId: string, beforeJson?: any, afterJson?: any, metadata?: any) {
    return tx.auditLog.create({
      data: {
        actor,
        action,
        entity,
        entityId,
        beforeJson: beforeJson || null,
        afterJson: afterJson || null,
        metadata: metadata || null
      }
    });
  }
}
